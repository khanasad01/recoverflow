import {
  OverviewData,
  Opportunity,
  Intervention,
  Customer,
  Experiment,
  LiftMetrics,
  IncrementalAttribution,
  PolicyData,
  SettingsData,
} from "./api";

export const MOCK_INTERVENTIONS: Intervention[] = [
  {
    id: "INT_99101",
    opportunity_id: "OPP_88192",
    action_type: "smart_retry",
    decision_reason: "Transient HDFC card network timeout; high probability recovery via ICICI gateway",
    confidence: 0.94,
    policy_status: "ALLOWED",
    external_ref: "pay_rzp_88192_retry",
    status: "SUCCESS",
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "INT_99102",
    opportunity_id: "OPP_88191",
    action_type: "payment_link",
    decision_reason: "UPI intent abandoned; dispatched 1-click WhatsApp payment link",
    confidence: 0.89,
    policy_status: "ALLOWED",
    external_ref: "plink_rzp_88191",
    status: "SUCCESS",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "INT_99103",
    opportunity_id: "OPP_88189",
    action_type: "human_review",
    decision_reason: "Annual enterprise SaaS invoice > ₹50,000 ceiling. Requires finance authorization.",
    confidence: 0.78,
    policy_status: "ESCALATED",
    external_ref: "esc_rzp_88189",
    status: "PENDING_APPROVAL",
    created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    id: "INT_99104",
    opportunity_id: "OPP_88188",
    action_type: "incentive",
    decision_reason: "Recurring subscription failed due to insufficient balance; scheduled retry on 1st of month",
    confidence: 0.82,
    policy_status: "ALLOWED",
    external_ref: "sub_rzp_88188",
    status: "IN_PROGRESS",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "INT_99105",
    opportunity_id: "OPP_88187",
    action_type: "smart_retry",
    decision_reason: "SBI 3DS authentication failure; dynamic retry triggered",
    confidence: 0.85,
    policy_status: "ALLOWED",
    external_ref: "pay_rzp_88187",
    status: "EXECUTING",
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "OPP_88192",
    merchant_id: "merch_live_123",
    source_type: "razorpay",
    source_id: "pay_Hdfc_88192",
    customer_id: "cust_zomato_991",
    customer_email: "rohit.sharma@zomato-delivery.in",
    amount_at_risk: 14850,
    currency: "INR",
    failure_reason: "Card network decline - Issuer gateway latency",
    status: "RECOVERED",
    status_reason: "Rescued via ICICI UPI Smart Retry rail in 184ms",
    retry_count: 1,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    latest_score: {
      id: "sc_88192",
      opportunity_id: "OPP_88192",
      model_version: "v2.4-gbm",
      recoverability_score: 0.94,
      expected_recovery: 13959,
      created_at: new Date().toISOString(),
    },
    interventions: [MOCK_INTERVENTIONS[0]],
  },
  {
    id: "OPP_88191",
    merchant_id: "merch_live_123",
    source_type: "razorpay",
    source_id: "pay_Upi_88191",
    customer_id: "cust_swiggy_442",
    customer_email: "priya.mehta@quickcommerce.co",
    amount_at_risk: 4200,
    currency: "INR",
    failure_reason: "UPI collect intent expired",
    status: "RECOVERED",
    status_reason: "Paid via WhatsApp 1-click payment link",
    retry_count: 1,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    latest_score: {
      id: "sc_88191",
      opportunity_id: "OPP_88191",
      model_version: "v2.4-gbm",
      recoverability_score: 0.89,
      expected_recovery: 3738,
      created_at: new Date().toISOString(),
    },
    interventions: [MOCK_INTERVENTIONS[1]],
  },
  {
    id: "OPP_88189",
    merchant_id: "merch_live_123",
    source_type: "razorpay",
    source_id: "inv_ent_88189",
    customer_id: "cust_zerodha_001",
    customer_email: "accounts@fintech-enterprise.com",
    amount_at_risk: 82500,
    currency: "INR",
    failure_reason: "Corporate credit limit threshold exceeded",
    status: "HUMAN_REVIEW",
    status_reason: "Amount ₹82,500 > ₹50,000 policy ceiling. Needs CFO authorization.",
    retry_count: 0,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    latest_score: {
      id: "sc_88189",
      opportunity_id: "OPP_88189",
      model_version: "v2.4-gbm",
      recoverability_score: 0.78,
      expected_recovery: 64350,
      created_at: new Date().toISOString(),
    },
    interventions: [MOCK_INTERVENTIONS[2]],
  },
  {
    id: "OPP_88188",
    merchant_id: "merch_live_123",
    source_type: "razorpay",
    source_id: "sub_rec_88188",
    customer_id: "cust_bharat_772",
    customer_email: "vijay.patel@bharatretail.in",
    amount_at_risk: 2499,
    currency: "INR",
    failure_reason: "Insufficient account balance at debit time",
    status: "ACTIONED",
    status_reason: "Rescheduled auto-debit aligned with customer salary cycle",
    retry_count: 1,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    latest_score: {
      id: "sc_88188",
      opportunity_id: "OPP_88188",
      model_version: "v2.4-gbm",
      recoverability_score: 0.82,
      expected_recovery: 2049,
      created_at: new Date().toISOString(),
    },
    interventions: [MOCK_INTERVENTIONS[3]],
  },
  {
    id: "OPP_88187",
    merchant_id: "merch_live_123",
    source_type: "razorpay",
    source_id: "pay_sbi_88187",
    customer_id: "cust_udaan_331",
    customer_email: "suresh.kumar@udaanlogistics.com",
    amount_at_risk: 9999,
    currency: "INR",
    failure_reason: "Bank 3DS authentication challenge timeout",
    status: "OPEN",
    status_reason: "Diagnosis complete; queued for smart retry",
    retry_count: 0,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    latest_score: {
      id: "sc_88187",
      opportunity_id: "OPP_88187",
      model_version: "v2.4-gbm",
      recoverability_score: 0.85,
      expected_recovery: 8499,
      created_at: new Date().toISOString(),
    },
    interventions: [MOCK_INTERVENTIONS[4]],
  },
  {
    id: "OPP_88186",
    merchant_id: "merch_live_123",
    source_type: "razorpay",
    source_id: "pay_axis_88186",
    customer_id: "cust_razor_552",
    customer_email: "deepak.nair@razor-ventures.org",
    amount_at_risk: 54000,
    currency: "INR",
    failure_reason: "Commercial credit card international declination",
    status: "HUMAN_REVIEW",
    status_reason: "Amount ₹54,000 > ₹50,000 policy ceiling. Needs operator review.",
    retry_count: 0,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    latest_score: {
      id: "sc_88186",
      opportunity_id: "OPP_88186",
      model_version: "v2.4-gbm",
      recoverability_score: 0.72,
      expected_recovery: 38880,
      created_at: new Date().toISOString(),
    },
    interventions: [],
  },
];

export const MOCK_OVERVIEW: OverviewData = {
  revenue_at_risk: 4238120,
  expected_recovery: 3144680,
  gross_recovered: 2891450,
  incremental_recovery: 618400,
  total_opportunities: 142,
  recovered_count: 98,
  actioned_count: 32,
  open_count: 12,
  recovery_rate_percent: 74.2,
  status_distribution: {
    RECOVERED: 98,
    ACTIONED: 32,
    OPEN: 8,
    HUMAN_REVIEW: 4,
    FAILED: 0,
  },
  recent_interventions: MOCK_INTERVENTIONS,
  timeline: [
    { date: "Aug 01", created: 1240000, recovered: 920000 },
    { date: "Aug 05", created: 1820000, recovered: 1450000 },
    { date: "Aug 10", created: 2450000, recovered: 1980000 },
    { date: "Aug 15", created: 3120000, recovered: 2600000 },
    { date: "Aug 20", created: 3850000, recovered: 3200000 },
    { date: "Aug 25", created: 4238120, recovered: 3650000 },
  ],
  time_series: [
    { timestamp: "2026-08-01", recovered_amount: 920000, incremental_recovery: 210000 },
    { timestamp: "2026-08-10", recovered_amount: 1980000, incremental_recovery: 420000 },
    { timestamp: "2026-08-20", recovered_amount: 3200000, incremental_recovery: 580000 },
    { timestamp: "2026-08-27", recovered_amount: 3650000, incremental_recovery: 618400 },
  ],
};

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust_zomato_991",
    merchant_id: "merch_live_123",
    external_id: "usr_zmt_991",
    email: "rohit.sharma@zomato-delivery.in",
    phone: "+91 98201 99100",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    total_opportunities: 4,
    total_recovered: 44550,
    opportunities: [MOCK_OPPORTUNITIES[0]],
  },
  {
    id: "cust_swiggy_442",
    merchant_id: "merch_live_123",
    external_id: "usr_swg_442",
    email: "priya.mehta@quickcommerce.co",
    phone: "+91 99302 44211",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    total_opportunities: 2,
    total_recovered: 8400,
    opportunities: [MOCK_OPPORTUNITIES[1]],
  },
  {
    id: "cust_zerodha_001",
    merchant_id: "merch_live_123",
    external_id: "usr_zrd_001",
    email: "accounts@fintech-enterprise.com",
    phone: "+91 80 4422 1100",
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    total_opportunities: 6,
    total_recovered: 245000,
    opportunities: [MOCK_OPPORTUNITIES[2]],
  },
  {
    id: "cust_bharat_772",
    merchant_id: "merch_live_123",
    external_id: "usr_bht_772",
    email: "vijay.patel@bharatretail.in",
    phone: "+91 94220 77200",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    total_opportunities: 3,
    total_recovered: 7497,
    opportunities: [MOCK_OPPORTUNITIES[3]],
  },
];

export const MOCK_EXPERIMENTS: Experiment[] = [
  {
    id: "EXP_001",
    name: "Multi-Agent Smart Retry vs Traditional Dunning",
    description: "Evaluates recovery lift of dynamic rail rerouting compared to static periodic retries",
    start_date: "2026-08-01",
    treatment_percent: 50,
    metric: "recovery_rate",
    status: "RUNNING",
    created_at: new Date(Date.now() - 27 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "EXP_002",
    name: "WhatsApp UPI 1-Click Link vs Email Notification",
    description: "Tests conversion rates on consumer drops using direct UPI deep-links",
    start_date: "2026-08-10",
    treatment_percent: 50,
    metric: "time_to_recover",
    status: "RUNNING",
    created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_LIFT_METRICS: LiftMetrics = {
  experiment_id: "EXP_001",
  experiment_name: "Multi-Agent Smart Retry vs Traditional Dunning",
  metric: "recovery_rate",
  status: "RUNNING",
  control: {
    total_opportunities: 71,
    recovered_opportunities: 38,
    recovery_rate: 0.535,
    recovered_amount: 1120000,
  },
  treatment: {
    total_opportunities: 71,
    recovered_opportunities: 53,
    recovery_rate: 0.746,
    recovered_amount: 1771450,
  },
  lift: {
    absolute_lift: 0.211,
    relative_lift_percent: 39.4,
    is_positive: true,
  },
};

export const MOCK_INCREMENTAL_ATTRIBUTION: IncrementalAttribution = {
  experiment_id: "EXP_001",
  experiment_name: "Multi-Agent Smart Retry vs Traditional Dunning",
  control: {
    total_count: 71,
    recovered_count: 38,
    total_amount_at_risk: 2090000,
    recovered_amount: 1120000,
    baseline_recovery_rate: 0.535,
  },
  treatment: {
    total_count: 71,
    recovered_count: 53,
    total_amount_at_risk: 2148120,
    gross_recovered_amount: 1771450,
  },
  attribution: {
    gross_recovery: 1771450,
    baseline_expected_recovery: 1149244,
    incremental_recovery: 622206,
    incremental_lift_percent: 54.1,
    is_statistically_incremental: true,
  },
};

export const MOCK_POLICY: PolicyData = {
  yaml_content: `# RecoverFlow Autonomous Policy Guardrails v2.4
package: recoverflow.policy

guardrails:
  max_auto_retry_amount: 50000 # Escalate to human review above ₹50,000
  max_retries_per_event: 3
  cooling_period_hours: 4
  prohibited_codes:
    - HARD_DECLINE_STOLEN_CARD
    - ACCOUNT_CLOSED
    - FRAUD_SUSPECTED

routing_priorities:
  tier_1: smart_retry_icici_direct
  tier_2: upi_whatsapp_1click
  tier_3: discount_incentive_5pct

rate_limits:
  daily_whatsapp_links_max: 500
  daily_smart_retries_max: 1000
  daily_incentives_max: 200
`,
  parsed: {
    max_auto_retry_amount: 50000,
    max_retries_per_event: 3,
    cooling_period_hours: 4,
  },
};

export const MOCK_SETTINGS: SettingsData = {
  environment: "Production (Live)",
  razorpay_key_id_masked: "rzp_live_••••••••8SbM",
  webhook_url: "https://api.recoverflow.dev/webhooks/razorpay",
  version: "v2.4.1-enterprise",
  status: "ONLINE",
};

export const MOCK_RESOURCE_USAGE = {
  smart_retry: { used: 421, total: 1000, unit: "executions/day" },
  payment_link: { used: 184, total: 500, unit: "links/day" },
  incentive: { used: 42, total: 200, unit: "offers/day" },
  human_escalation: { used: 8, total: 50, unit: "tickets/day" },
};
