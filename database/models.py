from datetime import datetime, date as dt_date
from sqlalchemy import (
    Column, String, Integer, Numeric, Boolean, DateTime, Date, Text, JSON, ForeignKey
)
from sqlalchemy.orm import relationship
from database.session import Base



class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    razorpay_key_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customers = relationship("Customer", back_populates="merchant")
    opportunities = relationship("RevenueOpportunity", back_populates="merchant")


class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    external_id = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="customers")
    payments = relationship("Payment", back_populates="customer")
    opportunities = relationship("RevenueOpportunity", back_populates="customer")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    external_id = Column(String, nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String, nullable=False)
    failure_reason = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="payments")
    subscriptions = relationship("Subscription", back_populates="payment")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    payment_id = Column(String, ForeignKey("payments.id"), nullable=True)
    external_id = Column(String, nullable=True, index=True)
    status = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(3), default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payment = relationship("Payment", back_populates="subscriptions")


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    external_id = Column(String, nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"
    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    external_id = Column(String, nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RevenueOpportunity(Base):
    __tablename__ = "revenue_opportunities"
    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    source_type = Column(String, nullable=False)
    source_id = Column(String, nullable=True)
    amount_at_risk = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    failure_reason = Column(String, nullable=True)
    status = Column(String, nullable=False, default="OPEN")
    group = Column(String, nullable=True)
    retry_count = Column(Integer, default=0)
    related_opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="opportunities")
    customer = relationship("Customer", back_populates="opportunities")
    scores = relationship("OpportunityScore", back_populates="opportunity", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="opportunity")
    outcomes = relationship("Outcome", back_populates="opportunity")
    evidence_events = relationship("EvidenceEvent", back_populates="opportunity")
    related_opportunity = relationship(
        "RevenueOpportunity",
        remote_side=[id],
        foreign_keys=[related_opportunity_id],
        backref="child_opportunities"
    )


    @property
    def latest_score(self):
        if self.scores:
            return sorted(self.scores, key=lambda s: s.created_at, reverse=True)[0]
        return None


class OpportunityScore(Base):
    __tablename__ = "opportunity_scores"
    id = Column(String, primary_key=True)
    opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=False)
    model_version = Column(String, nullable=False, default="heuristic_v1")
    recoverability_score = Column(Numeric(5, 4), nullable=False)
    expected_recovery = Column(Numeric(12, 2), nullable=False)
    priority_score = Column(Numeric(12, 4), nullable=True)
    features_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    opportunity = relationship("RevenueOpportunity", back_populates="scores")


class Intervention(Base):
    __tablename__ = "interventions"
    id = Column(String, primary_key=True)
    opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=False)
    action_type = Column(String, nullable=False)
    decision_reason = Column(Text, nullable=True)
    confidence = Column(Numeric(5, 4), nullable=True)
    policy_status = Column(String, nullable=False, default="APPROVED")
    external_ref = Column(String, nullable=True)
    status = Column(String, nullable=False, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    opportunity = relationship("RevenueOpportunity", back_populates="interventions")
    outcomes = relationship("Outcome", back_populates="intervention")


class Outcome(Base):
    __tablename__ = "outcomes"
    id = Column(String, primary_key=True)
    intervention_id = Column(String, ForeignKey("interventions.id"), nullable=True)
    opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=False)
    payment_status = Column(String, nullable=False)
    recovered_amount = Column(Numeric(12, 2), nullable=False, default=0)
    event_id = Column(String, nullable=True)
    observed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    intervention = relationship("Intervention", back_populates="outcomes")
    opportunity = relationship("RevenueOpportunity", back_populates="outcomes")


class Experiment(Base):
    __tablename__ = "experiments"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    treatment_percent = Column(Integer, default=50)
    metric = Column(String, default="recovery_rate")
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExperimentAssignment(Base):
    __tablename__ = "experiment_assignments"
    id = Column(String, primary_key=True)
    experiment_id = Column(String, ForeignKey("experiments.id"), nullable=False)
    opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=False)
    variant = Column(String, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)


class EvidenceEvent(Base):
    __tablename__ = "evidence_events"
    id = Column(String, primary_key=True)
    opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=False)
    intervention_id = Column(String, ForeignKey("interventions.id"), nullable=True)
    event_type = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    reason = Column(Text, nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    opportunity = relationship("RevenueOpportunity", back_populates="evidence_events")


class StrategyPerformance(Base):
    __tablename__ = "strategy_performance"
    id = Column(String, primary_key=True)
    segment_id = Column(String, nullable=True)
    failure_type = Column(String, nullable=True)
    action_type = Column(String, nullable=True)
    total_attempts = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    success_rate = Column(Numeric(5, 4), default=0.0, nullable=True)
    avg_lift = Column(Numeric(10, 4), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StrategyWeight(Base):
    __tablename__ = "strategy_weights"
    id = Column(String, primary_key=True)
    action_type = Column(String, nullable=False, index=True)
    failure_reason = Column(String, nullable=False, index=True)
    weight = Column(Numeric(5, 4), default=0.5, nullable=False)
    sample_size = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<StrategyWeight {self.action_type}/{self.failure_reason}: {self.weight}>"


class ResourceLimit(Base):

    __tablename__ = "resource_limits"
    id = Column(String, primary_key=True)
    action_type = Column(String, nullable=False, index=True)
    max_daily = Column(Integer, default=1000, nullable=False)
    current_count = Column(Integer, default=0, nullable=False)
    date = Column(Date, default=dt_date.today, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ResourceLimit {self.action_type}: {self.current_count}/{self.max_daily} ({self.date})>"


class RawEvent(Base):

    __tablename__ = "raw_events"
    id = Column(String, primary_key=True, index=True)
    source = Column(String, default="razorpay", nullable=False)
    event_type = Column(String, nullable=False, index=True)
    payload = Column(Text, nullable=False)

    processed = Column(Boolean, default=False, nullable=False)
    normalized_event_id = Column(String, nullable=True)
    opportunity_id = Column(String, ForeignKey("revenue_opportunities.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<RawEvent {self.id} - {self.event_type}>"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="support", nullable=False)  # admin, support, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class EmailOTP(Base):
    __tablename__ = "email_otps"
    id = Column(String, primary_key=True)
    email = Column(String, index=True, nullable=False)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<EmailOTP {self.email} (expires: {self.expires_at})>"


class WhatsAppOTP(Base):
    __tablename__ = "whatsapp_otps"
    id = Column(String, primary_key=True)
    phone = Column(String, index=True, nullable=False)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<WhatsAppOTP {self.phone} (expires: {self.expires_at})>"