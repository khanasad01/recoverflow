import os
import uuid
import logging
from typing import TypedDict, Optional, Dict, Any, List
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from database.models import RevenueOpportunity, EvidenceEvent, OpportunityScore, StrategyPerformance, StrategyWeight

from services.customer_profile.builder import CustomerProfileBuilder
from services.scoring.heuristic import HeuristicScoringService, compute_expected_recovery
from services.scoring.service import score_opportunity
from services.policy.engine import PolicyEngine
from services.action_executor.executor import ActionExecutor
from services.resource_manager import check_limit, increment_usage

logger = logging.getLogger(__name__)


class RecoveryState(TypedDict, total=False):
    opportunity_id: str
    db: Any
    opportunity_data: Dict[str, Any]
    customer_profile: Dict[str, Any]
    score: float
    expected_recovery: float
    diagnosis: str
    selected_action: str
    decision_reason: str
    confidence: float
    policy_allowed: bool
    policy_reason: str
    human_review: bool
    intervention_id: Optional[str]
    execution_status: str
    evidence_events: List[Dict[str, Any]]
    error: Optional[str]


def fallback_diagnose(reason: str, amount: float, score: float) -> str:
    """Deterministic rule-based diagnosis when LLM is unavailable or unconfigured."""
    r = (reason or "").lower().strip()
    if any(k in r for k in ["insufficient_funds", "payment_failed", "bad_request"]):
        return (
            f"Payment of INR {amount:.2f} failed due to balance/temporary issue ({reason}). "
            f"Recoverability score {score:.2f} indicates high recovery probability via instant payment link."
        )
    elif any(k in r for k in ["expired", "invalid", "card_declined"]):
        return (
            f"Payment of INR {amount:.2f} failed due to instrument decline ({reason}). "
            f"Customer notification recommended to retry or update credentials."
        )
    elif amount > 5000:
        return (
            f"High-value recovery opportunity (INR {amount:.2f}). "
            f"Escalation for human concierge follow-up recommended."
        )
    else:
        return f"Payment of INR {amount:.2f} interrupted with status '{reason or 'general decline'}'. Score: {score:.2f}."


# ================= Node 1: Load Opportunity =================
def load_opportunity_node(state: RecoveryState) -> RecoveryState:
    db: Session = state["db"]
    opp_id = state["opportunity_id"]

    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opp_id).first()
    if not opp:
        return {**state, "error": f"Opportunity {opp_id} not found"}

    # Ensure scored
    latest_score_obj = db.query(OpportunityScore).filter(
        OpportunityScore.opportunity_id == opp_id
    ).order_by(OpportunityScore.created_at.desc()).first()

    if not latest_score_obj:
        latest_score_obj = score_opportunity(opp_id, db)

    score = float(latest_score_obj.recoverability_score) if latest_score_obj else 0.5
    expected_recovery = float(latest_score_obj.expected_recovery) if latest_score_obj else compute_expected_recovery(score, float(opp.amount_at_risk or 0.0))

    profile_builder = CustomerProfileBuilder()
    profile = profile_builder.build_profile(opp.customer_id, db)

    opp_data = {
        "id": opp.id,
        "amount_at_risk": float(opp.amount_at_risk or 0.0),
        "currency": opp.currency,
        "failure_reason": opp.failure_reason,
        "source_type": opp.source_type,
        "status": opp.status,
        "retry_count": opp.retry_count or 0,
        "merchant_id": opp.merchant_id,
        "customer_id": opp.customer_id
    }

    return {
        **state,
        "opportunity_data": opp_data,
        "customer_profile": profile,
        "score": score,
        "expected_recovery": expected_recovery,
        "evidence_events": state.get("evidence_events", [])
    }


# ================= Node 2: Diagnose =================
def diagnose_node(state: RecoveryState) -> RecoveryState:
    if state.get("error"):
        return state

    opp = state["opportunity_data"]
    reason = opp.get("failure_reason") or "Unknown"
    amount = opp.get("amount_at_risk", 0.0)
    score = state.get("score", 0.5)

    diagnosis = None
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if api_key:
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        prompt = (
            f"Analyze this failed payment in 2 sentences. "
            f"Failure reason: {reason}, Amount: INR {amount}, Recoverability Score: {score:.2f}. "
            f"Customer Profile: {state.get('customer_profile')}."
        )
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                diagnosis = response.text.strip()
        except Exception as e:
            logger.warning(f"Google GenAI ({model_name}) diagnosis error: {e}, falling back to deterministic rules")

    if not diagnosis:
        diagnosis = fallback_diagnose(reason, amount, score)

    evidence = list(state.get("evidence_events", []))
    evidence.append({
        "event_type": "DIAGNOSIS_COMPLETED",
        "actor": "gemini_diagnosis_agent",
        "reason": diagnosis,
        "payload": {"score": score, "failure_reason": reason}
    })

    return {**state, "diagnosis": diagnosis, "evidence_events": evidence}


# ================= Node 3: Select Action =================
def select_action_node(state: RecoveryState) -> RecoveryState:
    if state.get("error"):
        return state

    score = state.get("score", 0.5)
    opp = state.get("opportunity_data", {})
    amount = float(opp.get("amount_at_risk", 0.0))
    retries = int(opp.get("retry_count", 0))
    failure_reason = (opp.get("failure_reason") or "").lower().strip()
    source_type = (opp.get("source_type") or "").lower().strip()
    db: Optional[Session] = state.get("db")

    # 1. Determine primary ranked candidate actions
    candidates: List[Tuple[str, str, float]] = []

    if retries >= 3:
        candidates.append(("human_escalation", "Max automated retries exceeded; requires concierge resolution.", 0.85))
    elif any(err in failure_reason for err in ["expired_card", "card_expired", "invalid_payment", "method_not_allowed"]):
        candidates.append(("payment_method_recovery", f"Payment instrument expired/invalid ({failure_reason}). Alternate payment method requested.", 0.89))
        candidates.append(("payment_link", "Fallback to instant payment link.", 0.80))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.70))
    elif any(err in failure_reason for err in ["bank_error", "network_issue", "temporary_error", "gateway_timeout"]) and retries < 2:
        candidates.append(("smart_retry", f"Transient error ({failure_reason}). Scheduled smart retry.", 0.92))
        candidates.append(("email_reminder", "Fallback to email reminder if smart retry unavailable.", 0.75))
    elif amount > 1000 and "card_declined" in failure_reason:
        candidates.append(("incentive", f"High-value order with decline ({failure_reason}). Generated discount incentive.", 0.88))
        candidates.append(("payment_method_recovery", "Alternative payment method recovery.", 0.82))
        candidates.append(("payment_link", "Fallback to payment link.", 0.80))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.70))
    elif ("upi" in failure_reason or "upi" in source_type) and amount <= 10000:
        candidates.append(("upi_qr", f"UPI recovery candidate (amount ₹{amount:.2f}). Dynamic UPI QR selected.", 0.91))
        candidates.append(("payment_link", "Fallback to payment link.", 0.80))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.70))
    elif any(sub in source_type for sub in ["subscription", "recurring", "invoice", "sub"]):
        candidates.append(("subscription_recovery", "Recurring billing failure. Initiated subscription dunning.", 0.85))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.75))
    elif "voice" in failure_reason:
        candidates.append(("voice_call", f"Urgent recovery phone nudge ({failure_reason}). Voice call initiated.", 0.86))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.75))
    elif score >= 0.7 and amount <= 10000:
        candidates.append(("payment_link", f"High recoverability ({score:.2f}). Instant payment link selected.", 0.90))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.75))
        candidates.append(("human_escalation", "Fallback to concierge follow-up.", 0.65))
    elif score >= 0.4:
        candidates.append(("email_reminder", f"Moderate score ({score:.2f}). Email reminder selected.", 0.75))
        candidates.append(("payment_link", "Fallback to payment link.", 0.70))
        candidates.append(("human_escalation", "Fallback to concierge follow-up.", 0.65))
    else:
        candidates.append(("human_escalation", f"Low score ({score:.2f}). Concierge follow-up selected.", 0.65))
        candidates.append(("email_reminder", "Fallback to email reminder.", 0.50))

    # Add general fallback candidates if not already present
    all_fallback = ["payment_method_recovery", "email_reminder", "payment_link", "human_escalation"]
    existing_actions = {c[0] for c in candidates}
    for fb in all_fallback:
        if fb not in existing_actions:
            candidates.append((fb, f"General fallback to {fb}.", 0.60))

    # 2. Apply Learning Loop Bias from StrategyWeights / StrategyPerformance
    perf_map: Dict[str, float] = {}
    if db:
        try:
            weights = db.query(StrategyWeight).all()
            for w in weights:
                if w.action_type:
                    perf_map[w.action_type] = float(w.weight or 0.5)
            if not perf_map:
                perf_records = db.query(StrategyPerformance).all()
                perf_map = {r.action_type: float(r.success_rate or r.avg_lift or 0.5) for r in perf_records if r.action_type}
        except Exception as e:
            logger.warning(f"Error querying strategy weights in select_action_node: {e}")
            perf_map = {}

    # 3. Check Resource Limits and Select Best Eligible Candidate
    selected_action = "stop"
    selected_reason = "All recovery actions restricted by daily resource limits."
    selected_confidence = 0.5

    for action_cand, reason_cand, conf_cand in candidates:
        # Check resource limit if db session available
        if db:
            is_available = check_limit(action_cand, db)
            if not is_available:
                logger.info(f"Resource limit reached for '{action_cand}', checking next candidate")
                continue

        # Learning weight adjustment: multiply confidence by (0.5 + weight)
        learn_weight = perf_map.get(action_cand, 0.5)
        adjusted_conf = min(0.99, max(0.10, round(conf_cand * (0.5 + learn_weight), 2)))

        selected_action = action_cand
        selected_reason = reason_cand
        selected_confidence = adjusted_conf
        break


    evidence = list(state.get("evidence_events", []))
    evidence.append({
        "event_type": "ACTION_SELECTED",
        "actor": "action_selection_agent",
        "reason": selected_reason,
        "payload": {
            "selected_action": selected_action,
            "confidence": selected_confidence,
            "learning_weight": perf_map.get(selected_action, 0.7)
        }
    })

    return {
        **state,
        "selected_action": selected_action,
        "decision_reason": selected_reason,
        "confidence": selected_confidence,
        "evidence_events": evidence
    }



# ================= Node 4: Check Policy =================
def check_policy_node(state: RecoveryState) -> RecoveryState:
    if state.get("error"):
        return state

    db: Session = state["db"]
    opp_id = state["opportunity_id"]
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opp_id).first()

    policy_engine = PolicyEngine()
    amount = float(opp.amount_at_risk or 0.0)

    # 1. High-value Human Review Guardrail Check (> ₹50,000 threshold)
    if policy_engine.needs_human_approval(amount):
        logger.warning(
            f"Opportunity {opp_id} amount (INR {amount}) exceeds human approval threshold (₹50,000). "
            f"Setting status to HUMAN_REVIEW."
        )
        opp.status = "HUMAN_REVIEW"
        db.commit()

        evidence = list(state.get("evidence_events", []))
        evidence.append({
            "event_type": "HUMAN_REVIEW_REQUIRED",
            "actor": "policy_guardrail_engine",
            "reason": f"Amount (INR {amount:.2f}) exceeds human approval threshold (INR 50,000.00).",
            "payload": {
                "allowed": False,
                "human_review": True,
                "amount": amount,
                "threshold": 50000
            }
        })

        return {
            **state,
            "policy_allowed": False,
            "policy_reason": "Opportunity requires explicit human approval before execution",
            "human_review": True,
            "selected_action": "stop",
            "evidence_events": evidence
        }

    # 2. Normal Action Policy Evaluation
    action = state.get("selected_action", "email_reminder")
    eval_result = policy_engine.evaluate(opp, action)

    evidence = list(state.get("evidence_events", []))
    evidence.append({
        "event_type": "POLICY_EVALUATED",
        "actor": "policy_guardrail_engine",
        "reason": eval_result.get("reason"),
        "payload": {"allowed": eval_result["allowed"], "action": action}
    })

    if not eval_result["allowed"]:
        logger.warning(f"Policy denied action '{action}': {eval_result['reason']}")
        # Fallback hierarchy
        fallback_action = "email_reminder" if action in ("payment_link", "smart_retry", "incentive", "upi_qr") else "human_escalation"
        fallback_eval = policy_engine.evaluate(opp, fallback_action)

        if fallback_eval["allowed"]:
            action = fallback_action
            decision_reason = f"Policy fallback: {eval_result['reason']}. Switched to {fallback_action}."
        else:
            action = "stop"
            decision_reason = f"Policy completely restricted all recovery actions: {eval_result['reason']}."

        return {
            **state,
            "selected_action": action,
            "decision_reason": decision_reason,
            "policy_allowed": False,
            "policy_reason": eval_result.get("reason"),
            "human_review": False,
            "evidence_events": evidence
        }

    return {
        **state,
        "policy_allowed": True,
        "policy_reason": eval_result.get("reason"),
        "human_review": False,
        "evidence_events": evidence
    }


# ================= Node 5: Execute Action =================
def execute_action_node(state: RecoveryState) -> RecoveryState:
    if state.get("error"):
        return state

    if state.get("human_review"):
        logger.info(f"Opportunity {state['opportunity_id']} is pending human review. Skipping automated execution.")
        return {
            **state,
            "execution_status": "PENDING_APPROVAL",
            "intervention_id": None
        }

    db: Session = state["db"]
    opp_id = state["opportunity_id"]
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opp_id).first()
    action = state.get("selected_action", "stop")

    if action == "stop":
        return {
            **state,
            "execution_status": "SKIPPED",
            "intervention_id": None
        }

    executor = ActionExecutor()
    intervention = executor.execute(
        opportunity=opp,
        action_type=action,
        decision_reason=state.get("decision_reason", ""),
        confidence=state.get("confidence", 0.8),
        db=db
    )

    # Increment daily resource counter
    try:
        increment_usage(action, db)
    except Exception as inc_err:
        logger.warning(f"Failed to increment resource usage for {action}: {inc_err}")

    evidence = list(state.get("evidence_events", []))
    evidence.append({
        "event_type": "ACTION_EXECUTED",
        "actor": "action_executor_service",
        "reason": f"Executed {action} with status {intervention.status}",
        "payload": {"intervention_id": intervention.id, "external_ref": intervention.external_ref}
    })

    return {
        **state,
        "intervention_id": intervention.id,
        "execution_status": intervention.status,
        "evidence_events": evidence
    }



# ================= Node 6: Finalize =================
def finalize_node(state: RecoveryState) -> RecoveryState:
    if state.get("error"):
        return state

    db: Session = state["db"]
    opp_id = state["opportunity_id"]
    intervention_id = state.get("intervention_id")

    # Persist all generated evidence events
    for ev in state.get("evidence_events", []):
        event_record = EvidenceEvent(
            id=f"ev_{uuid.uuid4().hex[:12]}",
            opportunity_id=opp_id,
            intervention_id=intervention_id,
            event_type=ev["event_type"],
            actor=ev["actor"],
            reason=ev.get("reason"),
            payload=ev.get("payload")
        )
        db.add(event_record)

    db.commit()
    logger.info(f"Recovery orchestration completed for Opportunity {opp_id}")
    return state


# ================= Graph Compilation =================
def create_recovery_graph():
    """Builds and compiles the multi-agent LangGraph workflow."""
    workflow = StateGraph(RecoveryState)

    workflow.add_node("load_opportunity", load_opportunity_node)
    workflow.add_node("diagnose", diagnose_node)
    workflow.add_node("select_action", select_action_node)
    workflow.add_node("check_policy", check_policy_node)
    workflow.add_node("execute_action", execute_action_node)
    workflow.add_node("finalize", finalize_node)

    workflow.set_entry_point("load_opportunity")
    workflow.add_edge("load_opportunity", "diagnose")
    workflow.add_edge("diagnose", "select_action")
    workflow.add_edge("select_action", "check_policy")
    workflow.add_edge("check_policy", "execute_action")
    workflow.add_edge("execute_action", "finalize")
    workflow.add_edge("finalize", END)

    return workflow.compile()


recovery_graph_app = create_recovery_graph()


def run_recovery_graph(opportunity_id: str, db: Session) -> Dict[str, Any]:
    """Execute the recovery graph for an opportunity."""
    initial_state: RecoveryState = {
        "opportunity_id": opportunity_id,
        "db": db,
        "evidence_events": []
    }
    result = recovery_graph_app.invoke(initial_state)
    return result
