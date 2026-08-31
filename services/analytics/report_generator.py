from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database.models import (
    RevenueOpportunity,
    Outcome,
    Experiment,
    StrategyPerformance,
    Customer,
    Intervention
)
from services.attribution.attribution import calculate_incremental_recovery


class ExecutiveReportGenerator:
    """
    Generates high-level executive recovery performance reports
    for C-level stakeholders, finance teams, and merchant operations.
    """

    def generate_report_data(self, db: Session) -> Dict[str, Any]:
        opps = db.query(RevenueOpportunity).all()
        outcomes = db.query(Outcome).all()
        customers = db.query(Customer).all()
        interventions = db.query(Intervention).all()
        strategies = db.query(StrategyPerformance).all()

        total_opps = len(opps)
        total_at_risk = sum(float(o.amount_at_risk or 0.0) for o in opps)

        recovered_opps = [o for o in opps if (o.status or "").upper() == "RECOVERED"]
        recovered_count = len(recovered_opps)
        recovery_rate_pct = round((recovered_count / total_opps * 100), 2) if total_opps > 0 else 0.0

        recovered_outcomes = [
            out for out in outcomes
            if (out.payment_status or "").lower() in ["captured", "paid", "recovered", "success"]
        ]
        gross_recovered = sum(float(out.recovered_amount or 0.0) for out in recovered_outcomes)

        # Attribution
        attr_result = calculate_incremental_recovery("default", db)
        inc_recovery = attr_result.get("attribution", {}).get("incremental_recovery", 0.0) if attr_result else 0.0

        # Action breakdown
        channel_counts = {}
        for inv in interventions:
            act = inv.action_type or "unknown"
            channel_counts[act] = channel_counts.get(act, 0) + 1

        # Failure reason breakdown
        failure_dist = {}
        for o in opps:
            reason = o.failure_reason or "UNSPECIFIED"
            failure_dist[reason] = failure_dist.get(reason, 0) + 1

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_opportunities": total_opps,
                "total_customers_impacted": len(customers),
                "total_revenue_at_risk": round(total_at_risk, 2),
                "gross_recovered_amount": round(gross_recovered, 2),
                "incremental_recovery_amount": round(inc_recovery, 2),
                "recovery_rate_percent": recovery_rate_pct,
                "total_interventions_dispatched": len(interventions)
            },
            "channel_distribution": channel_counts,
            "failure_distribution": failure_dist,
            "strategy_performance": [
                {
                    "action_type": s.action_type,
                    "failure_reason": s.failure_reason,
                    "avg_lift": float(s.avg_lift or 0.0),
                    "success_count": s.success_count,
                    "total_count": s.total_count
                }
                for s in strategies
            ]
        }

    def generate_markdown_summary(self, db: Session) -> str:
        data = self.generate_report_data(db)
        s = data["summary"]
        md = f"""# 📈 RecoverFlow Executive Recovery Performance Report
**Generated:** {data['generated_at']}

## 1. Key Performance Indicators
- **Total Revenue at Risk:** ₹{s['total_revenue_at_risk']:,.2f}
- **Gross Recovered Revenue:** ₹{s['gross_recovered_amount']:,.2f}
- **Incremental Revenue (Causal Lift):** ₹{s['incremental_recovery_amount']:,.2f}
- **Recovery Success Rate:** {s['recovery_rate_percent']}% ({s['total_opportunities']} opportunities evaluated)
- **Autonomous Interventions Dispatched:** {s['total_interventions_dispatched']}

## 2. Channel Performance
"""
        for ch, count in data["channel_distribution"].items():
            md += f"- **{ch.replace('_', ' ').title()}:** {count} actions\n"

        return md
