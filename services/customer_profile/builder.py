from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from database.models import Payment, RevenueOpportunity


class CustomerProfileBuilder:
    """Builds historical customer profile and aggregated payment metrics."""

    def build_profile(self, customer_id: Optional[str], db: Session) -> Dict[str, Any]:
        """
        Aggregates payment history and opportunity records for the customer.
        Returns metrics including 30d/90d successful/failed payments, average amount,
        and past recovery success rate.
        """
        default_profile = {
            "customer_id": customer_id,
            "successful_payment_count_30d": 0,
            "successful_payment_count_90d": 0,
            "failed_payment_count_30d": 0,
            "failed_payment_count_90d": 0,
            "average_payment_amount": 0.0,
            "previous_recovery_success_rate": 0.0,
            "total_payments_count": 0,
            "total_opportunities_count": 0,
        }

        if not customer_id:
            return default_profile

        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        ninety_days_ago = now - timedelta(days=90)

        # Query all payments for this customer
        payments = db.query(Payment).filter(Payment.customer_id == customer_id).all()

        success_30d = 0
        success_90d = 0
        failed_30d = 0
        failed_90d = 0
        total_amount = 0.0
        total_count = len(payments)

        for p in payments:
            amt = float(p.amount or 0.0)
            total_amount += amt
            status = (p.status or "").lower()
            p_time = p.created_at or now

            is_success = status in ("captured", "success", "paid", "authorized")
            is_failed = status in ("failed", "failure", "error")

            if p_time >= thirty_days_ago:
                if is_success:
                    success_30d += 1
                elif is_failed:
                    failed_30d += 1

            if p_time >= ninety_days_ago:
                if is_success:
                    success_90d += 1
                elif is_failed:
                    failed_90d += 1

        avg_amount = round(total_amount / total_count, 2) if total_count > 0 else 0.0

        # Query opportunities for past recovery rate
        opportunities = db.query(RevenueOpportunity).filter(
            RevenueOpportunity.customer_id == customer_id
        ).all()

        total_opps = len(opportunities)
        recovered_opps = sum(1 for opp in opportunities if opp.status == "RECOVERED")
        recovery_rate = round(recovered_opps / total_opps, 4) if total_opps > 0 else 0.0

        return {
            "customer_id": customer_id,
            "successful_payment_count_30d": success_30d,
            "successful_payment_count_90d": success_90d,
            "failed_payment_count_30d": failed_30d,
            "failed_payment_count_90d": failed_90d,
            "average_payment_amount": avg_amount,
            "previous_recovery_success_rate": recovery_rate,
            "total_payments_count": total_count,
            "total_opportunities_count": total_opps,
        }
