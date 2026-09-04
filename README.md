# RecoverFlow 🚀
### Enterprise Autonomous Payment Failure Recovery & Revenue Intelligence Engine

**Multi-Source Ingestion (Razorpay + Stripe) → Unified Event Normalization → Customer 360 & Scikit-Learn ML Scoring → Multi-Agent Orchestration (LangGraph + Gemini) → Dynamic Resource Quota Manager → Deterministic Policy Guardrails & Human Authorization → 6 Specialized Action Adapters → Self-Learning Feedback Loop → A/B Experimentation & Incremental Revenue Attribution**

---

## 🏗️ System Architecture

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
        |  - StripeNormalizer       |                               |  - Strategy Performance   |
        |  - UnifiedEvent Schema    |                               |  - Resource Reset (Beat)  |
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

## ✨ Key Enterprise Capabilities

1. **Multi-Gateway Ingestion**:
   - Native support for **Razorpay** (`payment.failed`, `payment.captured`, `payment_link.paid`) and **Stripe** (`payment_intent.payment_failed`, `invoice.payment_failed`, `checkout.session.completed`).
   - HMAC-SHA256 signature verification per gateway with asynchronous non-blocking ingestion into PostgreSQL and Redis Streams.
2. **Opportunity Graph & Retry Linking**:
   - Self-referential database linking connects multiple failure attempts for the same customer into an interconnected Opportunity Graph.
3. **Hybrid ML Scoring (Heuristic & Scikit-Learn)**:
   - Dynamic recoverability scoring based on customer lifetime value, historical success rates, gateway decline codes, and transaction velocity.
4. **LangGraph Multi-Agent Orchestrator**:
   - Multi-node state graph orchestrating Diagnosis (Gemini LLM / Rule Fallback), Action Ranking, Resource Limit Verification, and Dynamic Policy Checks.
5. **Adaptive Resource Limit Management & Dynamic Fallback**:
   - Daily quotas (`payment_link: 500`, `smart_retry: 1000`, `incentive: 200`, `email_reminder: 2000`, `human_escalation: 50`) prevent customer fatigue and rate limiting.
   - If an action quota is exhausted, the orchestrator **dynamically falls back to the next best eligible action** automatically.
6. **Human Authorization Workflow**:
   - High-value opportunities exceeding configurable threshold (`> ₹50,000`) trigger a `HUMAN_REVIEW` status requiring admin approval.
7. **Empirical Self-Learning Feedback Loop**:
   - Hourly Celery Beat task aggregates historical recovery outcomes, calculating empirical `success_rate` weights per failure reason to bias subsequent agent decisions.
8. **Causal Incrementality & A/B Experimentation**:
   - Randomized 50/50 A/B splitting (Treatment vs Control) with automated lift calculation and baseline attribution.
9. **Next.js 14 Razorpay-Style Command Center**:
   - Real-time Revenue Health section (Healthy, At Risk, Critical), Explainable `<WhyCard />` breakdown, interactive policy editor with YAML validation, and SSE live telemetry.

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone & Environment Configuration
```bash
git clone https://github.com/your-org/recoverflow.git
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

### 3. Log In to Dashboard
- **URL**: `http://localhost:3000/login`
- **Admin**: `admin@recoverflow.dev` / `admin123`
- **Support**: `support@recoverflow.dev` / `support123`

---

## 📡 REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Healthcheck probe |
| `GET` | `/metrics` | Public | Prometheus scrape telemetry |
| `POST` | `/api/v1/auth/login` | Public | JWT token issuance |
| `POST` | `/webhooks/razorpay` | HMAC | Razorpay webhook ingestion |
| `POST` | `/webhooks/stripe` | HMAC | Stripe webhook ingestion |
| `GET` | `/api/v1/overview` | Auth | Executive KPIs & distribution |
| `GET` | `/api/v1/opportunities` | Auth | Filterable opportunities list |
| `GET` | `/api/v1/opportunities/{id}` | Auth | Opportunity detail & score |
| `POST` | `/api/v1/opportunities/{id}/action` | Auth | Manual action dispatch override |
| `POST` | `/api/v1/opportunities/{id}/approve` | Auth | Approve high-value opportunity |
| `POST` | `/api/v1/opportunities/{id}/reject` | Auth | Reject opportunity intervention |
| `GET` | `/api/v1/opportunities/{id}/evidence`| Auth | Immutable evidence audit trail |
| `GET` | `/api/v1/interventions` | Auth | List executed interventions |
| `GET` | `/api/v1/customers` | Auth | Customer 360 overview |
| `GET` | `/api/v1/experiments` | Auth | A/B experimentation tracking |
| `GET` | `/api/v1/experiments/{id}/lift` | Auth | Recovery lift calculation |
| `GET` | `/api/v1/analytics/incremental` | Auth | Incremental revenue attribution |
| `GET` | `/api/v1/analytics/resource-usage` | Admin | Real-time daily quota tracking |
| `GET` | `/api/v1/analytics/report` | Auth | Stakeholder report (JSON/MD) |
| `GET` | `/api/v1/policy` | Auth | Read active YAML policy |
| `PUT` | `/api/v1/policy` | Admin | Hot-reload YAML policy |

---

## 🧪 Testing & Verification

### 1. Automated Test Suite (72/72 Passing Tests)
```bash
docker compose exec api pytest tests/ -v
```

### 2. End-to-End Pipeline Verification Script
```bash
docker compose exec api python scripts/e2e_test.py
```

### 3. Frontend Production Build
```bash
cd dashboard
npm run build
```

---

---

## 🔄 CI/CD Pipeline & Deployment

RecoverFlow includes an automated GitHub Actions CI/CD pipeline:

### Workflows
- **Backend Continuous Deployment** (`.github/workflows/deploy.yml`):
  - Automatically triggers on pushes to `main` modifying backend directories (`apps/**`, `services/**`, `database/**`, `integrations/**`, `requirements.txt`, `docker-compose.yml`).
  - Deploys via SSH to the AWS EC2 production host (`13.222.186.232`).
  - Pulls the latest code and executes `docker compose up -d --build`.
- **Frontend Continuous Integration** (`.github/workflows/frontend-deploy.yml`):
  - Triggers on pushes touching `dashboard/**`.
  - Verifies production Next.js compilation (`npm run build`).
  - Netlify automatically deploys the production build to [https://recoverflows.netlify.app](https://recoverflows.netlify.app).

### GitHub Secrets Configuration
To enable the EC2 SSH deployment workflow:
1. In the GitHub repository, open **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. **Name**: `EC2_SSH_KEY`
4. **Secret**: Paste the full content of your EC2 `.pem` private key file.

---

## 📊 Benchmark & Load Testing

Benchmark performance reports generated using **Grafana k6 (v2.2.0)** on AWS EC2 backend infrastructure:
- **Full Report**: [tests/LOAD_TEST_RESULTS.md](file:///c:/Users/ASUS/Downloads/recoverflow/tests/LOAD_TEST_RESULTS.md)
- **Health Ingress**: 1,437 requests, 46.35 req/s, **0.00% errors**, **p95 = 211.88ms**.
- **Auth & Opportunities Ingress**: 328 requests, 20 concurrent VUs, **100% checks succeeded**, **0.00% errors**.

---

## 📑 Hackathon Submission
- Comprehensive submission details, architecture rationale, and failure recovery matrices are documented in [SUBMISSION.md](file:///c:/Users/ASUS/Downloads/recoverflow/SUBMISSION.md).

---

## ☸️ Kubernetes Deployment

Production-ready Kubernetes manifests are located in `k8s/`:
- `k8s/api-deployment.yaml`: FastAPI deployment with readiness/liveness probes and autoscaling.
- `k8s/worker-deployment.yaml`: Celery worker & beat deployments.
- `k8s/postgres.yaml` & `k8s/redis.yaml`: Persistent volume claims and database statefulsets.
- `k8s/ingress.yaml`: TLS ingress routing.

```bash
kubectl apply -f k8s/
```

---

## 🎨 Dashboard Redesign & Production Polish (Phases 0–7)

The RecoverFlow executive dashboard (`dashboard/`) has completed full production redesign, accessibility compliance, and QA verification:
- **Phases 0–3**: Information architecture, fintech design system, responsive navigation, and core feature views.
- **Phase 4**: Dark mode navy palette, precision typography, and layout optimizations.
- **Phase 5**: Contextual loading skeletons, interactive empty states, error retry handling, and toast feedback.
- **Phase 6**: Responsive breakpoints (Desktop, Tablet 72px icon collapse, Mobile off-canvas drawer) and WCAG AA accessibility compliance (`Escape` dismissal, focus rings, table semantics).
- **Phase 7**: End-to-end demo flow testing, anti-generic design sanitization, link integrity, and final production sign-off.

---

*Built with Python 3.11, FastAPI, LangGraph, Scikit-Learn, Celery, Redis, PostgreSQL, Next.js, and Tailwind CSS.*
