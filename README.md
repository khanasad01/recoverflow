<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status">
  <img src="https://img.shields.io/badge/tests-102%2F102-success" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-0.115-blue" alt="FastAPI">
</p>

# RecoverFlow 🚀
### Enterprise Autonomous Payment Failure Recovery & Revenue Intelligence Engine

**Multi-Source Ingestion (Razorpay + Stripe) → Unified Event Normalization → Customer 360 & Scikit-Learn ML Scoring → Multi-Agent Orchestration (LangGraph + Gemini) → Dynamic Resource Quota Manager → Deterministic Policy Guardrails & Human Authorization → 6 Specialized Action Adapters → Self-Learning Feedback Loop → A/B Experimentation & Incremental Revenue Attribution**

---

## 📑 Table of Contents
- [Problem](#-problem)
- [Solution](#-solution)
- [Why We Win](#-why-we-win)
- [Demo](#-demo)
- [Architecture](#-architecture)
- [AI Judgment](#-ai-judgment)
- [Safety & Guardrails](#-safety--guardrails)
- [Metrics](#-metrics)
- [Buildthon Criteria Mapping](#-buildthon-criteria-mapping)
- [Technology Stack](#-technology-stack)
- [Live Demo & Access](#-live-demo--access)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Team](#-team)
- [Screenshots & Demo](#-screenshots--demo)

---

<a id="-problem"></a>
## 🛑 Problem
In recurring billing and SaaS, **10% to 15% of transactions fail**, and over **30% of total customer churn is completely involuntary**—caused by transient bank timeouts, expired cards, or temporary balance shortfalls. Merchants typically rely on dumb retries or manual follow-ups, resulting in lost revenue and alert fatigue.

---

<a id="-solution"></a>
## 💡 Solution
RecoverFlow is an autonomous payment failure recovery and revenue intelligence engine. 

1. **Multi-Gateway Ingestion**: Native support for **Razorpay** and **Stripe** with HMAC signature verification.
2. **Opportunity Graph & Retry Linking**: Self-referential database linking connects multiple failure attempts for the same customer into an interconnected Opportunity Graph.
3. **Hybrid ML Scoring (Heuristic & Scikit-Learn)**: Dynamic recoverability scoring based on customer lifetime value, historical success rates, gateway decline codes, and transaction velocity.
4. **LangGraph Multi-Agent Orchestrator**: Multi-node state graph orchestrating Diagnosis (Gemini LLM / Rule Fallback), Action Ranking, Resource Limit Verification, and Dynamic Policy Checks.
5. **Next.js 14 Command Center**: Real-time Revenue Health section, Explainable `<WhyCard />` breakdown, interactive policy editor with YAML validation, and SSE live telemetry.

---

<a id="-why-we-win"></a>
## 🏆 Why We Win
Most recovery systems stop at "recovered ₹X". RecoverFlow measures **incremental recovery** by running randomized control trials (A/B tests). We compare treatment vs. control group to show true lift, not just gross recovery. This is rare in hackathon projects and directly proves financial impact.

---

<a id="-demo"></a>
## 🎬 Demo
We built a fully functioning dashboard with real metrics, AI diagnosis, and autonomous agent tracing. See the [Live Demo & Access](#-live-demo--access) section below for credentials.

---

<a id="-architecture"></a>
## 🏗️ Architecture

```text
               +----------------------------------+     +----------------------------------+
               |        Razorpay Webhooks         |     |         Stripe Webhooks          |
               | (failed, captured, link.paid)    |     | (failed, invoice_failed, paid)   |
               +----------------+-----------------+     +----------------+-----------------+
                                |                                        |
                                +-------------------+--------------------+
                                                    |
                                                    v
                                +---------------------------------------+
                                |       FastAPI Ingestion Gateway       |
                                |  - HMAC-SHA256 Multi-Gateway Auth     |
                                |  - Prometheus Telemetry & Metrics     |
                                |  - Redis Stream Event Streaming       |
                                +-------------------+-------------------+
                                                    | (async task enqueue)
                                                    v
                                +---------------------------------------+
                                |       Celery Workers & Redis Broker   |
                                +-------------------+-------------------+
                                                    |
                      +-----------------------------+-----------------------------+
                      |                                                           |
                      v                                                           v
        +---------------------------+                               +---------------------------+
        |    Normalizer Pipeline    |                               |    Outcome Tracker &      |
        |  - RazorpayNormalizer     |                               |    Self-Learning Loop     |
        |  - StripeNormalizer       |                               |  - UnifiedEvent Schema    |
        +-------------+-------------+                               +---------------------------+
                      |
                      v
        +---------------------------+
        |    Opportunity Engine     |
        |  - Opportunity Graph Link |
        |  - A/B Variant Assignment |
        +-------------+-------------+
                      |
                      v
        +---------------------------+
        |  Customer Profile & ML    |
        |  - 30d/90d Payment History|
        |  - Scikit-Learn ML Scorer |
        +-------------+-------------+
                      |
                      v
        +---------------------------+
        |  LangGraph Multi-Agent    |
        |  1. Diagnosis (Gemini)    |
        |  2. Self-Learning Bias    |
        |  3. Resource Quota Check  |
        |  4. Dynamic Fallback      |
        |  5. Policy Guardrails     |
        |     - Human Approval      |
        +-------------+-------------+
                      |
        +-------------+-------------+-------------------------------------------+
        |                           |                                           |
        v                           v                                           v
+------------------+       +------------------+                       +------------------+
|  Autonomous Link |       |  Smart Retry     |                       |  Human Concierge |
|  - Payment Links |       |  - Exp. Backoff  |                       |  - Escalation    |
|  - Incentives    |       |  - Sub Dunning   |                       |  - Approval Gate |
+------------------+       +------------------+                       +------------------+
```

---

<a id="-ai-judgment"></a>
## 🧠 AI Judgment
The orchestrator leverages **Gemini 2.5 Flash** for deep diagnosis of failure reasons. It contextualizes the user's history and gateway decline codes to output 3 key insights:
1. *Why it failed?*
2. *Why recovery is possible?*
3. *Why the selected rail was chosen?*

---

<a id="-safety--guardrails"></a>
## 🛡️ Safety & Guardrails
- **Adaptive Resource Limit Management & Dynamic Fallback**: Daily quotas prevent customer fatigue. If exhausted, it falls back to the next best action.
- **Human Authorization Workflow**: High-value opportunities exceeding a configurable threshold (`> ₹50,000`) trigger a `HUMAN_REVIEW` status requiring admin approval.
- **Deterministic YAML Policies**: Hot-reloadable rules governing attempt caps and cooldowns.

---

<a id="-metrics"></a>
## 📈 Metrics
Benchmark performance reports generated using **Grafana k6 (v2.2.0)** on AWS EC2 backend infrastructure:
- **Full Report**: [tests/LOAD_TEST_RESULTS.md](tests/LOAD_TEST_RESULTS.md)
- **Health Ingress**: 1,437 requests, 46.35 req/s, **0.00% errors**, **p95 = 211.88ms**.
- **Auth & Opportunities Ingress**: 328 requests, 20 concurrent VUs, **100% checks succeeded**, **0.00% errors**.

---

<a id="-buildthon-criteria-mapping"></a>
## 📋 Buildthon Criteria Mapping

| Criteria | Proof | Where to See |
|----------|-------|--------------|
| **Problem Taste** | Real revenue loss problem, ₹42.38L at risk in demo data | Dashboard Overview |
| **Build Quality** | 102 hermetic tests, 0 lint errors, CI/CD green | `pytest tests/ -v`, GitHub Actions |
| **AI Judgment** | AI used only for diagnosis/scoring, deterministic guardrails | `agents/orchestrator/graph.py`, `policies/default_policy.yaml` |
| **Failure Recovery** | Idempotency, retries, offline fallback, resource quotas | `services/worker/tasks.py`, `dashboard/src/lib/api.ts` (fallback) |

---

<a id="-technology-stack"></a>
## 🛠️ Technology Stack
*Built with Python 3.11, FastAPI, LangGraph, Scikit-Learn, Celery, Redis, PostgreSQL, Next.js, and Tailwind CSS.*

---

<a id="-live-demo--access"></a>
## 🔗 Live Demo & Access

- **Frontend:** https://recoverflows.netlify.app
- **Backend Swagger:** http://13.222.186.232:8000/docs

> ⚠️ Demo environment uses test credentials and synthetic data. For access, use the "Quick Demo Fill" button on the login page, or contact the team.

---

<a id="-getting-started"></a>
## 🚀 Getting Started

### 1. Clone & Environment Configuration
```bash
git clone https://github.com/khanasad01/recoverflow.git
cd recoverflow
cp .env.example .env
```

### 2. Start All Services
```bash
docker compose up -d --build
```
This boots up:
- **FastAPI Backend**: `http://localhost:8000`
- **Next.js Dashboard**: `http://localhost:3000`
- **PostgreSQL 16**: `localhost:5432`
- **Redis 7**: `localhost:6379`
- **Celery Worker & Celery Beat Scheduler**
- **Prometheus Metrics**: `http://localhost:8000/metrics`

### 3. Testing & Verification
```bash
# Automated Test Suite (102/102 Passing Tests)
pytest tests/ -v

# Frontend Production Build
cd dashboard
npm run build
```

---

<a id="-roadmap"></a>
## 🔮 Roadmap (Next 3 Months)
- Add subscription & checkout abandonment recovery.
- Replace heuristic scoring with real ML model (XGBoost).
- Move to Kafka for event streaming at scale.
- Add merchant-specific custom policies via UI.
- Deploy on Kubernetes with Prometheus/Grafana.

---

<a id="-screenshots--demo"></a>
## 📸 Screenshots & Demo
![RecoverFlow Overview](docs/overview.png)
![Recovery Flow GIF](docs/demo.gif)

---

<a id="-team"></a>
## 👥 Team
| Name | Role |
|------|------|
| **Assad Akram** | Solo Developer - Product, Backend, Frontend, AI/ML, DevOps |
> Built end-to-end as a solo engineering effort.

---

## 📑 Hackathon Submission
- Comprehensive submission details, architecture rationale, and failure recovery matrices are documented in [SUBMISSION.md](SUBMISSION.md).
