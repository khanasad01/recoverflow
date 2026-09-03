# RecoverFlow 🚀
### Enterprise Autonomous Payment Failure Recovery & Revenue Intelligence Engine

---

## 1. Problem Taste

### The Challenge: Involuntary Churn & Silent Revenue Bleed
In modern subscription and e-commerce businesses, **up to 10–15% of all recurring transactions fail**. While voluntary cancellations receive high product attention, **involuntary churn** (caused by card declines, transient bank gateway timeouts, expired instruments, or temporary balance shortfalls) accounts for **over 30% of total customer churn**.

Merchants traditionally respond with two deeply flawed extremes:
1. **Dumb, Rigid Retry Scripts**: Blindly retrying cards at fixed intervals. This triggers gateway rate limits, incurs penalty fees, and repeatedly hits exhausted rails, ultimately burning customer goodwill.
2. **Manual Support Outreach**: High latency, labor-intensive spreadsheets that take days to act, by which time the customer has abandoned the service.

### RecoverFlow's Solution & Live Metrics
RecoverFlow is an autonomous revenue recovery engine that intercepts failed payment webhooks in real time, diagnoses the root cause, applies deterministic policy guardrails, and executes the optimal recovery rail without manual intervention.

- **11 Active Demo Opportunities**: Live in the PostgreSQL database across **Razorpay** and **Stripe** rails, spanning realistic recovery values from **₹1,999 to ₹75,000**.
- **5 Real Production Action Rails**:
  1. **Smart Retry (`smart_retry`)**: Creates real orders on Razorpay's API (`order_xxx`), visible directly inside the merchant's Razorpay Dashboard for scheduled processing.
  2. **Payment Links (`payment_link`)**: Generates real, hosted Razorpay payment links (`plink_xxx`) allowing customers to pay via alternative payment methods (UPI, NetBanking, Cards).
  3. **Personalized Incentives (`incentive`)**: Dynamically computes 10% rescue coupons (`RECOVERXXXXX`) to convert high-value drops before churn.
  4. **Direct Email Sequences (`email_reminder`)**: Dispatches real, branded dunning emails via **SendGrid API** to customer inboxes with itemized payment details.
  5. **WhatsApp Notifications (`whatsapp`)**: Sends real conversational recovery alerts via **Twilio WhatsApp API** directly to the customer's phone.
- **Human Authorization Guardrail**: Transactions exceeding **₹50,000** automatically escalate to `HUMAN_REVIEW` status, requiring explicit administrator approval in the command center.

---

## 2. Build Quality

### Production Architecture & Tech Stack

```text
[ Razorpay / Stripe Webhooks ]
             │ (HMAC-SHA256 Verification)
             ▼
[ FastAPI Ingestion Gateway ] ────► [ Redis 7 Event Stream & Idempotency ]
             │
             ▼
[ Celery Workers & Beat Scheduler ]
             │
   ┌─────────┴───────────────────────────────┐
   ▼                                         ▼
[ ML Recoverability Scorer ]        [ Policy Engine (Deterministic Rules) ]
(Probability & EV Estimation)       (Max Retries, Ceilings, Human Approval Gate)
   │                                         │
   └───────────────────┬─────────────────────┘
                       ▼
            [ 5 Action Adapters ]
  ┌──────────┬──────────┬──────────┬──────────┐
  ▼          ▼          ▼          ▼          ▼
SendGrid   Twilio    Razorpay   Razorpay   Dynamic
 Email    WhatsApp    Links      Orders   Incentives
  │          │          │          │          │
  └──────────┴──────────┴──────────┴──────────┘
                       ▼
          [ PostgreSQL 16 Master DB ]
                       ▲
                       │ (Authenticated REST API / JWT)
[ Next.js 14/16 Enterprise Dashboard ] (Hosted on Netlify Edge)
```

- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS, SWR real-time data synchronization, Lucide fintech iconography, and Sonner toast architecture.
- **Backend API**: FastAPI (Python 3.11, async event loop), Pydantic v2 data schemas, SQLAlchemy 2.0 ORM with connection pooling.
- **Data & Task Architecture**: PostgreSQL 16 (relational schema with Opportunity Graphs and Foreign Key cascades), Redis 7 (broker, stream buffer, and distributed locks), Celery + Celery Beat (asynchronous distributed workers).
- **Deployment & Cloud Infrastructure**:
  - **Frontend**: Deployed on **Netlify Edge CDN** with SSR-safe hydration and continuous deployment.
  - **Backend & Database**: Containerized via **Docker Compose** on **AWS EC2** (`13.222.186.232`).
  - **Integrations**: SendGrid Mail API, Twilio WhatsApp Messaging API, Razorpay Payment Links & Orders APIs, Stripe Webhooks.

### Key Engineering Patterns
- **Adapter Pattern for Action Executors**: All recovery rails implement the clean `ActionAdapter` interface. Adding a new recovery provider (e.g., SMS, Voice Call, or Affirm) requires zero refactoring of core orchestration logic.
- **Deterministic Policy Engine**: Rules-as-code evaluating failure reasons, maximum attempts (frequency capping), and financial ceilings before any debit or notification rail can be fired.
- **Enterprise Security & RBAC**:
  - Cryptographic **HMAC-SHA256** webhook signature verification.
  - Signed RS256/HS256 **JWT access tokens** with strict role-based access control (`admin`, `support`, `viewer`).
  - Strict CORS isolation and automatic purging of stale/mock tokens on client session expiry.

### Live Demo URLs & Credentials

| Component | URL / Location | Credentials |
| :--- | :--- | :--- |
| **Live Command Center** | [https://recoverflows.netlify.app](https://recoverflows.netlify.app) | **Admin**: `admin@recoverflow.dev` / `admin123`<br>**Support**: `support@recoverflow.dev` / `support123` |
| **Backend REST API** | [http://13.222.186.232:8000/docs](http://13.222.186.232:8000/docs) | Interactive Swagger UI (Requires Bearer Auth) |
| **GitHub Repository** | [https://github.com/khanasad01/recoverflow](https://github.com/khanasad01/recoverflow) | Public repository |
| **Razorpay Dashboard** | `dashboard.razorpay.com` | Orders (`smart_retry`) & Payment Links (`payment_link`) |

---

## 3. AI Judgment

In enterprise financial engineering, knowing **where NOT to use AI** is just as critical as knowing where to use it. RecoverFlow draws a strict architectural boundary between probabilistic intelligence and deterministic execution:

### Where AI IS Used
1. **Recoverability ML Scoring**:
   - Computes a probabilistic recoverability score ($0.00 \to 1.00$) and Expected Recovery Value ($EV = \text{amount} \times \text{score}$) based on customer payment history, transaction velocity, gateway decline codes, and merchant category benchmarks.
2. **Diagnosis & Action Rail Recommendation**:
   - Multi-agent orchestrator evaluates unstructured gateway decline notes (e.g., distinguishing between a transient network timeout, insufficient funds, or a hard card expiration) and recommends the highest-probability recovery rail.

### Where AI IS NOT Used
1. **Webhook Signature Verification**:
   - Strictly performed via mathematical **HMAC-SHA256** byte comparison. LLMs are never used in security authentication paths.
2. **Policy Enforcement & Financial Guardrails**:
   - Ceiling limits (> ₹50,000), frequency caps (max attempts), and eligible decline reason matrices are evaluated by a 100% deterministic Python rules engine.
3. **Automated Retry Loops & Money Movement**:
   - Debit attempts and payment link issuance follow strict deterministic state machines. No LLM has autonomy to charge customer accounts or alter payment amounts.

### Engineering Rationale
> **Payment-critical paths demand 100% auditability and zero hallucination risk.**  
> An LLM hallucinating a discount percentage, inventing an invalid transaction amount, or retrying a card 50 times in an uncontrolled loop causes regulatory violations, chargebacks, and brand destruction. By isolating AI to **diagnosis and ranking**, while gating execution behind **deterministic policy rules and human authorization**, RecoverFlow achieves the speed of autonomous recovery with institutional-grade reliability.

---

## 4. Failure Recovery Matrix

RecoverFlow is architected with defensive resilience patterns across every tier of the payment recovery lifecycle:

| Failure Mode | Impact | Mitigation Strategy in RecoverFlow |
| :--- | :--- | :--- |
| **Webhook Duplication** | Risk of double-counting declines, spamming customers, or duplicate order creation | **Redis Idempotency Locks + DB Unique Constraints**: Webhook payloads are hashed with gateway event IDs (`raw_events.event_id` unique constraint). In-flight duplicates are rejected via Redis `SETNX` within a 60-second sliding deduplication window. |
| **Action Executor Failure** | Temporary third-party API outage (e.g., SendGrid/Twilio rate limit or timeout) | **Celery Exponential Backoff with Jitter**: Failed adapter executions retry with exponential backoff (`delay = base * 2^retry + jitter`). Persistent failures route to a Dead-Letter Queue (DLQ) for audit inspection. |
| **Backend Outage / Network Partition** | User navigation blocked, dashboard whiteout | **Client-Side Cache & Offline Fallback**: The Next.js frontend catches fetch network exceptions and gracefully falls back to structured client-side demo states with an ambient status banner, automatically resynchronizing once health checks pass. |
| **Payment Provider Outage** | Specific gateway (e.g., Razorpay or Stripe) experiences API degradation | **Circuit Breaker & Multi-Rail Fallback**: If an execution rail fails 5 consecutive times, the circuit breaker opens. The orchestrator dynamically shifts traffic to an alternative rail (e.g., falling back from card retry to hosted payment link or UPI QR code). |
| **Policy Violation / Quota Exhaustion** | Action exceeds merchant attempt caps or customer dunning thresholds | **Deterministic Policy Shield**: The policy engine rejects prohibited actions with HTTP 422 before execution. High-value transactions (> ₹50,000) automatically transition to `HUMAN_REVIEW`, locking autonomous execution until an authorized Admin approves. |
