import json
import logging
from database.session import SessionLocal
from database.models import RawEvent, RevenueOpportunity
from services.normalizer.razorpay_normalizer import RazorpayNormalizer
from services.normalizer.stripe_normalizer import StripeNormalizer
from services.opportunity_engine.engine import process_unified_event
from services.scoring.service import score_opportunity
from services.learning.update import update_strategy_performance
from agents.orchestrator.graph import run_recovery_graph
from services.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def store_raw_event(self, event_id: str, event_type: str, payload: str, source: str = "razorpay"):
    """Store raw webhook event in DB with idempotency and trigger processing."""
    db = SessionLocal()
    try:
        existing = db.query(RawEvent).filter(RawEvent.id == event_id).first()
        if existing:
            logger.info(f"Duplicate event ignored: {event_id}")
            return {"status": "duplicate"}

        raw_event = RawEvent(
            id=event_id,
            source=source.lower(),
            event_type=event_type,
            payload=payload,
            processed=False
        )
        db.add(raw_event)
        db.commit()
        logger.info(f"Stored raw event: {event_id} ({event_type}, source={source})")
        
        # Enqueue processing task
        process_raw_event.delay(event_id)
        return {"status": "received"}
    except Exception as exc:
        db.rollback()
        logger.error(f"Error storing event {event_id}: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def process_raw_event(self, raw_event_id: str):
    """Fetch raw event, normalize via appropriate gateway normalizer (Stripe/Razorpay), process via OpportunityEngine, score, and trigger recovery."""
    db = SessionLocal()
    try:
        raw_event = db.query(RawEvent).filter(RawEvent.id == raw_event_id).first()
        if not raw_event:
            logger.warning(f"RawEvent not found: {raw_event_id}")
            return {"status": "not_found"}

        if raw_event.processed:
            logger.info(f"RawEvent already processed: {raw_event_id}")
            return {"status": "already_processed", "opportunity_id": raw_event.opportunity_id}

        try:
            payload_data = json.loads(raw_event.payload) if isinstance(raw_event.payload, str) else raw_event.payload
        except Exception as e:
            logger.error(f"Invalid JSON in RawEvent {raw_event_id}: {e}")
            raw_event.processed = True
            db.commit()
            return {"status": "invalid_payload"}

        # Select normalizer based on event source
        if (raw_event.source or "").lower() == "stripe":
            normalizer = StripeNormalizer()
        else:
            normalizer = RazorpayNormalizer()

        unified_event = normalizer.normalize(payload_data)

        # Process through opportunity engine
        opp = process_unified_event(unified_event, db)


        # Update RawEvent
        raw_event.processed = True
        raw_event.normalized_event_id = unified_event.event_id
        if opp:
            raw_event.opportunity_id = opp.id
            # Calculate and store recoverability score
            try:
                score_opportunity(opp.id, db)
            except Exception as score_err:
                logger.error(f"Failed to score opportunity {opp.id}: {score_err}")

            # Trigger recovery workflow if opportunity is newly open
            if opp.status == "OPEN":
                try:
                    run_recovery_workflow.delay(opp.id)
                except Exception as wf_err:
                    logger.error(f"Failed to enqueue recovery workflow for {opp.id}: {wf_err}")

        db.commit()
        logger.info(f"Successfully processed RawEvent {raw_event_id} -> Opportunity: {opp.id if opp else None}")
        return {"status": "processed", "opportunity_id": opp.id if opp else None}
    except Exception as exc:
        db.rollback()
        logger.error(f"Error processing raw event {raw_event_id}: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def process_outcome_event(self, raw_event_id: str):
    """Specifically process captured/paid webhook events to update outcomes and recovered statuses."""
    return process_raw_event(raw_event_id)


@celery_app.task(bind=True, max_retries=2, default_retry_delay=10)
def run_recovery_workflow(self, opportunity_id: str):
    """Execute end-to-end multi-agent recovery workflow on an opportunity."""
    db = SessionLocal()
    try:
        opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
        if not opp:
            logger.warning(f"Opportunity not found for recovery workflow: {opportunity_id}")
            return {"status": "not_found"}

        if opp.status in ("RECOVERED", "CLOSED"):
            logger.info(f"Opportunity {opportunity_id} already resolved: {opp.status}")
            return {"status": "skipped", "opportunity_status": opp.status}

        logger.info(f"Running multi-agent recovery workflow for opportunity: {opportunity_id}")
        result = run_recovery_graph(opportunity_id, db)

        return {
            "status": "completed",
            "opportunity_id": opportunity_id,
            "selected_action": result.get("selected_action"),
            "execution_status": result.get("execution_status"),
            "intervention_id": result.get("intervention_id")
        }
    except Exception as exc:
        db.rollback()
        logger.error(f"Error executing recovery workflow for {opportunity_id}: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task
def aggregate_strategy_performance():
    """Periodic Celery Beat task to aggregate strategy performance metrics across all interventions."""
    db = SessionLocal()
    try:
        updated = update_strategy_performance(db)
        logger.info(f"Aggregated strategy performance: {len(updated)} rows updated")
        return {"status": "success", "rows_updated": len(updated)}
    except Exception as e:
        logger.error(f"Error in aggregate_strategy_performance: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task
def auto_update_policy():
    """Periodic Celery Beat task to compute empirical win rates and update strategy weights."""
    from services.learning.update import auto_update_policy_weights
    db = SessionLocal()
    try:
        updated = auto_update_policy_weights(db)
        logger.info(f"[CeleryBeat] Auto-updated {len(updated)} strategy weights successfully")
        return {"status": "success", "weights_updated": len(updated)}
    except Exception as e:
        logger.error(f"Error in auto_update_policy task: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task
def reset_resource_counters():
    """Daily Celery Beat task running at midnight to reset action execution quotas."""
    from services.resource_manager import reset_daily_counters
    db = SessionLocal()
    try:
        count = reset_daily_counters(db)
        logger.info(f"Midnight resource limit reset completed for {count} records")
        return {"status": "success", "counters_reset": count}
    except Exception as e:
        logger.error(f"Error in reset_resource_counters: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()