from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class RequestEmailOTPRequest(BaseModel):
    email: str


class VerifyEmailOTPRequest(BaseModel):
    email: str
    otp: str


class RequestWhatsAppOTPRequest(BaseModel):
    phone: str


class VerifyWhatsAppOTPRequest(BaseModel):
    phone: str
    otp: str


class OTPResponse(BaseModel):
    message: str
    status: str = "sent"
    demo_otp: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    phone: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse



class ManualActionRequest(BaseModel):
    action_type: str
    decision_reason: Optional[str] = "manual override"
    confidence: Optional[float] = 1.0



class OpportunityScoreResponse(BaseModel):
    id: str
    opportunity_id: str
    model_version: str
    recoverability_score: float
    expected_recovery: float
    priority_score: Optional[float] = None
    features_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterventionResponse(BaseModel):
    id: str
    opportunity_id: str
    action_type: str
    decision_reason: Optional[str] = None
    confidence: Optional[float] = None
    policy_status: str
    external_ref: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OutcomeResponse(BaseModel):
    id: str
    intervention_id: Optional[str] = None
    opportunity_id: str
    payment_status: str
    recovered_amount: float
    event_id: Optional[str] = None
    observed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EvidenceEventResponse(BaseModel):
    id: str
    opportunity_id: str
    intervention_id: Optional[str] = None
    event_type: str
    actor: str
    reason: Optional[str] = None
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExperimentResponse(BaseModel):
    id: str
    name: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    treatment_percent: int
    metric: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateExperimentRequest(BaseModel):
    name: str
    treatment_percent: Optional[int] = 50
    metric: Optional[str] = "recovery_rate"


class ExperimentLiftResponse(BaseModel):
    experiment_id: str
    experiment_name: str
    metric: str
    status: str
    control: Dict[str, Any]
    treatment: Dict[str, Any]
    lift: Dict[str, Any]


class StrategyPerformanceResponse(BaseModel):
    id: str
    segment_id: Optional[str] = None
    failure_type: Optional[str] = None
    action_type: Optional[str] = None
    total_attempts: int
    success_count: int
    success_rate: Optional[float] = 0.0
    avg_lift: Optional[float] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResourceLimitResponse(BaseModel):
    id: str
    action_type: str
    max_daily: int
    current_count: int
    remaining: int
    usage_percent: float
    date: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)



class IncrementalRecoveryResponse(BaseModel):
    experiment_id: str
    experiment_name: str
    control: Dict[str, Any]
    treatment: Dict[str, Any]
    attribution: Dict[str, Any]


class OpportunityResponse(BaseModel):
    id: str
    merchant_id: str
    customer_id: Optional[str] = None
    source_type: str
    source_id: Optional[str] = None
    amount_at_risk: float
    currency: str
    failure_reason: Optional[str] = None
    status: str
    group: Optional[str] = None
    retry_count: int = 0
    related_opportunity_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    latest_score: Optional[OpportunityScoreResponse] = None

    model_config = ConfigDict(from_attributes=True)



class OpportunityDetailResponse(OpportunityResponse):
    scores: List[OpportunityScoreResponse] = []
    interventions: List[InterventionResponse] = []
    outcomes: List[OutcomeResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CustomerResponse(BaseModel):
    id: str
    merchant_id: str
    external_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    total_opportunities: int = 0
    total_recovered: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class CustomerDetailResponse(CustomerResponse):
    profile_metrics: Dict[str, Any] = {}
    opportunities: List[OpportunityResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OverviewResponse(BaseModel):
    revenue_at_risk: float
    expected_recovery: float
    gross_recovered: float
    incremental_recovery: float
    total_opportunities: int
    recovered_count: int
    actioned_count: int
    open_count: int
    recovery_rate_percent: float
    status_distribution: Dict[str, int]
    recent_interventions: List[InterventionResponse] = []
    timeline: List[Dict[str, Any]] = []


class PolicyResponse(BaseModel):
    yaml_content: str
    parsed: Dict[str, Any]


class UpdatePolicyRequest(BaseModel):
    yaml_content: str


class SettingsResponse(BaseModel):
    environment: str
    razorpay_key_id_masked: str
    webhook_url: str
    version: str
    status: str
