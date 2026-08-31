# RecoverFlow: 3-Minute Live System Demo Walkthrough

A structured, step-by-step demo guide to showcase RecoverFlow's **real-time multi-source ingestion**, **explainable multi-agent recovery orchestration**, **human approval guardrails**, **dynamic resource quotas**, and **incremental revenue attribution**.

---

## ⏱️ Demo Agenda & Timeline (3 Minutes Total)

| Minute | Segment | Focus Area |
|---|---|---|
| **0:00 - 0:45** | Executive Command Center & Revenue Health | Dashboard KPIs, Revenue Health breakdown, Live SSE stream |
| **0:45 - 1:30** | Multi-Source Ingestion & AI Explainability | Razorpay/Stripe events, Recoverability Scoring & `<WhyCard />` |
| **1:30 - 2:15** | Guardrails, Human Authorization & Action Dispatch | Policy thresholds (> ₹50k), Human Approval, Action Execution |
| **2:15 - 3:00** | Incremental Attribution & Self-Learning Loop | A/B Testing vs Control, Strategy Performance, Resource Quotas |

---

## 🚀 Step-by-Step Demo Script

### 1. Executive Login & Revenue Health Overview (0:00 – 0:45)
1. Navigate to `http://localhost:3000/login`.
2. Log in using administrator credentials:
   - **Email:** `admin@recoverflow.dev`
   - **Password:** `admin123`
3. Land on **Executive Overview** (`http://localhost:3000/`):
   - Highlight the **Real-Time Revenue Health Status** section:
     - 🛡️ **Healthy / Recovered**: Resolved payments and high-confidence opportunities.
     - 💓 **In Active Recovery**: Pipeline under autonomous multi-agent dunning.
     - 🔥 **Critical Exposure**: High-ticket payments (> ₹10k) with severe failure reasons.
   - Point out the **Gross Recovered** (₹16,298.00) vs **Incremental Lift** (₹16,298.00) proving revenue recovery was incremental against an un-contacted A/B control group.
   - Mention the real-time **SSE Live Active** feed streaming live agent events.

---

### 2. Multi-Source Ingestion & "Why Card" Explainability (0:45 – 1:30)
1. Navigate to **Revenue Recovery Opportunities** (`http://localhost:3000/opportunities`).
2. Show the **Gateway Source Filter**:
   - Filter between `All Gateways`, `Razorpay`, and `Stripe`.
   - Point out self-referential graph linking (e.g., `↳ Linked to opp_xxx`) where multiple decline retries from the same customer are connected into an Opportunity Graph.
3. Click on any opportunity row to open the **Opportunity Detail Drawer**:
   - Highlight the **Explainable AI Recovery Matrix (`<WhyCard />`)**:
     - 🧠 **Multi-Agent Diagnosis**: LLM analysis explaining *why* the transaction declined.
     - 📊 **Recoverability Score**: Visual gauge (e.g. 75% probability).
     - ⚡ **Selected Intervention**: Specific adapter selected (`payment_link`, `smart_retry`, `incentive`, `subscription_recovery`) and its rationale.
     - ⚖️ **Policy Guardrail**: Evaluation indicator (`POLICY PASSED`).
     - 🎯 **Confidence Score**: Multi-agent consensus level.

---

### 3. Human Authorization & Action Execution (1:30 – 2:15)
1. Locate an opportunity marked with `HUMAN_REVIEW` status (amount > ₹50,000):
   - Show the **Human Authorization Required Banner**:
     > *"This opportunity amount exceeds the autonomous policy threshold (₹50,000). Administrator approval is required before recovery actions are executed."*
   - Click **Approve & Execute**.
   - Watch the status transition to `ACTIONED` and the intervention trigger instantly in the background.
2. In the **Dispatch Recovery Action Override Grid**, demonstrate triggering any of the 6 specialized adapters:
   - `Payment Link`
   - `Smart Retry` (with exponential backoff)
   - `Incentive` (discount promo code generator)
   - `Email Reminder`
   - `Sub Retry` (recurring dunning cycle)
   - `Concierge Escalate`

---

### 4. Incremental Attribution, Self-Learning & Resource Quotas (2:15 – 3:00)
1. Navigate to **Attribution & Experiments** (`http://localhost:3000/experiments`):
   - Show the live randomized A/B experiment: **Treatment Group** (AI Interventions) vs **Control Group** (No Intervention).
   - Point out **Statistical Recovery Lift** (+68.4% relative recovery lift over baseline organic retry rate).
2. Show **Policy & Resource Limits**:
   - Navigate to `http://localhost:3000/policy` to show the declarative monospace YAML editor with real-time syntax validation.
   - Show Resource Quotas (`GET /api/v1/analytics/resource-usage`):
     - Daily quotas preventing message fatigue (`payment_link: 500`, `smart_retry: 1000`, `email_reminder: 2000`, `human_escalation: 50`).
3. Conclude:
   > *"RecoverFlow transforms reactive payment declines into an autonomous, explainable, and resource-governed profit center — fully observable with 100% test coverage."*

---

## 🛠️ Quick Verification Commands for Presenters

```powershell
# Run Full End-to-End Pipeline Verification
docker compose exec api python scripts/e2e_test.py

# Run Complete Automated Test Suite (72 tests)
docker compose exec api pytest tests/ -v

# Verify Production Frontend Build
cd dashboard && npm run build
```
