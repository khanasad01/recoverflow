import time
import requests
import json
import sys
from decimal import Decimal

API_BASE = "http://localhost:8000"

def log(msg: str):
    print(f"[E2E TEST] {msg}")

def main():
    log("==========================================================")
    log("Starting RecoverFlow Full End-to-End Pipeline Verification")
    log("==========================================================")

    # 1. Healthcheck
    log("1. Checking API Health Probe...")
    try:
        r = requests.get(f"{API_BASE}/health", timeout=5)
        if r.status_code != 200:
            log(f"Health check failed with status {r.status_code}")
            sys.exit(1)
        log("   API is healthy: " + json.dumps(r.json()))
    except Exception as e:
        log(f"API is unreachable at {API_BASE}: {e}")
        sys.exit(1)

    # 2. Authenticate as Admin
    log("2. Authenticating as Admin User...")
    login_resp = requests.post(
        f"{API_BASE}/api/v1/auth/login",
        json={"email": "admin@recoverflow.dev", "password": "admin123"},
        timeout=5
    )
    if login_resp.status_code != 200:
        log(f"Failed to authenticate: {login_resp.text}")
        sys.exit(1)
    
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    log("   Admin authentication token acquired successfully.")

    # 3. Ingest Synthetic Razorpay Webhook Event
    log("3. Ingesting Synthetic Razorpay Payment Failure with HMAC signature...")
    import hmac
    import hashlib
    import os

    rzp_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "mock_webhook_secret").encode("utf-8")
    razorpay_event = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_e2e_{int(time.time())}",
                    "amount": 450000,
                    "currency": "INR",
                    "status": "failed",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed due to temporary bank network issue",
                    "error_reason": "bank_error",
                    "contact": "+919876543210",
                    "email": "e2e_customer@example.com",
                    "created_at": int(time.time())
                }
            }
        }
    }
    rzp_raw = json.dumps(razorpay_event).encode("utf-8")
    rzp_sig = hmac.new(rzp_secret, rzp_raw, hashlib.sha256).hexdigest()

    webhook_resp = requests.post(
        f"{API_BASE}/webhooks/razorpay",
        data=rzp_raw,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": rzp_sig},
        timeout=5
    )
    log(f"   Razorpay Webhook Response: {webhook_resp.status_code} - {webhook_resp.json()}")

    # 4. Ingest Synthetic Stripe Webhook Event
    log("4. Ingesting Synthetic Stripe Payment Intent Failure with HMAC signature...")
    stripe_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "recoverflow_stripe_webhook_secret_123").encode("utf-8")
    stripe_event = {
        "id": f"evt_e2e_{int(time.time())}",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": f"pi_e2e_{int(time.time())}",
                "amount": 750000,
                "currency": "inr",
                "status": "requires_payment_method",
                "customer": "cus_stripe_e2e",
                "last_payment_error": {
                    "code": "card_declined",
                    "message": "The customer card was declined due to insufficient funds.",
                    "decline_code": "insufficient_funds"
                }
            }
        }
    }
    stripe_raw = json.dumps(stripe_event).encode("utf-8")
    t_str = str(int(time.time()))
    signed_payload = f"{t_str}.".encode() + stripe_raw
    v1_sig = hmac.new(stripe_secret, signed_payload, hashlib.sha256).hexdigest()
    stripe_sig = f"t={t_str},v1={v1_sig}"

    stripe_resp = requests.post(
        f"{API_BASE}/webhooks/stripe",
        data=stripe_raw,
        headers={"Content-Type": "application/json", "Stripe-Signature": stripe_sig},
        timeout=5
    )
    log(f"   Stripe Webhook Response: {stripe_resp.status_code} - {stripe_resp.json()}")



    # 5. Wait for asynchronous worker processing
    log("5. Waiting 3 seconds for asynchronous Celery workers to process events...")
    time.sleep(3)

    # 6. Fetch Opportunities via REST API
    log("6. Fetching Opportunities via API...")
    opps_resp = requests.get(f"{API_BASE}/api/v1/opportunities", headers=headers, timeout=5)
    opps = opps_resp.json()
    log(f"   Total opportunities found: {len(opps)}")
    assert len(opps) > 0, "No opportunities found in database!"
    
    target_opp = opps[0]
    opp_id = target_opp["id"]
    log(f"   Target opportunity for testing: {opp_id} (Amount: INR {target_opp['amount_at_risk']}, Score: {target_opp.get('latest_score', {}).get('recoverability_score')})")

    # 7. Test Manual Recovery Action Trigger
    log(f"7. Dispatching Manual Action 'payment_link' on Opportunity {opp_id}...")
    action_resp = requests.post(
        f"{API_BASE}/api/v1/opportunities/{opp_id}/action",
        headers=headers,
        json={"action_type": "payment_link", "reason": "E2E automated test trigger"},
        timeout=5
    )
    log(f"   Action Trigger Response: {action_resp.status_code} - {action_resp.json()}")
    assert action_resp.status_code == 200

    # 8. Check Evidence Audit Trail
    log(f"8. Verifying Immutable Evidence Trail for Opportunity {opp_id}...")
    evidence_resp = requests.get(f"{API_BASE}/api/v1/opportunities/{opp_id}/evidence", headers=headers, timeout=5)
    evidence = evidence_resp.json()
    log(f"   Total evidence records: {len(evidence)}")
    assert len(evidence) > 0

    # 9. Verify Resource Usage Limits API
    log("9. Verifying Resource Limit Quotas API...")
    usage_resp = requests.get(f"{API_BASE}/api/v1/analytics/resource-usage", headers=headers, timeout=5)
    usage_data = usage_resp.json()
    log(f"   Resource Quotas Tracked: {len(usage_data)} actions")
    for u in usage_data:
        log(f"     - {u['action_type']}: {u['current_count']}/{u['max_daily']} used ({u['remaining']} remaining)")

    # 10. Check Overview & Incremental Attribution
    log("10. Fetching Executive Overview & Attribution Metrics...")
    overview_resp = requests.get(f"{API_BASE}/api/v1/overview", headers=headers, timeout=5)
    overview = overview_resp.json()
    log(f"   Revenue at Risk: INR {overview.get('revenue_at_risk', 0):,.2f}")
    log(f"   Gross Recovered: INR {overview.get('gross_recovered', 0):,.2f}")
    log(f"   Incremental Lift: INR {overview.get('incremental_recovery', 0):,.2f}")

    log("==========================================================")
    log("SUCCESS: RecoverFlow E2E Pipeline Verification Completed!")
    log("==========================================================")

if __name__ == "__main__":
    main()
