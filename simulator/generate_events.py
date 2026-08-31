import os
import time
import json
import hmac
import hashlib
import random
import uuid
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
import requests

DEFAULT_WEBHOOK_URL = os.getenv("WEBHOOK_TARGET_URL", "http://localhost:8000/webhooks/razorpay")
DEFAULT_STRIPE_URL = os.getenv("STRIPE_WEBHOOK_URL", "http://localhost:8000/webhooks/stripe")
DEFAULT_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "recoverflow_webhook_secret_123")
DEFAULT_STRIPE_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_recoverflow_stripe_test_secret_123")

INDIAN_CUSTOMERS = [
    {"name": "Rajesh Sharma", "email": "rajesh.sharma@gmail.com", "phone": "+919820123456"},
    {"name": "Priya Patel", "email": "priya.patel@outlook.com", "phone": "+919833234567"},
    {"name": "Amit Verma", "email": "amit.verma@techcorp.in", "phone": "+919811345678"},
    {"name": "Ananya Iyer", "email": "ananya.iyer@fintech.io", "phone": "+919845456789"},
    {"name": "Vikram Malhotra", "email": "vikram.malhotra@enterprise.com", "phone": "+919876567890"},
    {"name": "Sneha Reddy", "email": "sneha.reddy@startup.co", "phone": "+919866678901"},
    {"name": "Rohan Gupta", "email": "rohan.gupta@consulting.in", "phone": "+919899789012"},
    {"name": "Divya Nair", "email": "divya.nair@globaltech.com", "phone": "+919840890123"},
    {"name": "Karthik Sundaram", "email": "karthik.s@saasbox.io", "phone": "+919884901234"},
    {"name": "Meera Joshi", "email": "meera.joshi@designstudio.in", "phone": "+919821012345"},
]

FAILURE_REASONS = [
    ("BAD_REQUEST_ERROR", "Payment failed due to insufficient funds", "insufficient_funds"),
    ("BAD_REQUEST_ERROR", "Card was declined by issuing bank", "card_declined"),
    ("BAD_REQUEST_ERROR", "Payment processing failed", "payment_failed"),
    ("GATEWAY_ERROR", "Gateway timed out during 3D secure authentication", "gateway_timeout"),
    ("BAD_REQUEST_ERROR", "Card has expired", "expired_card"),
    ("BANK_ERROR", "Bank server unavailable / temporary network issue", "bank_error"),
    ("NETWORK_ERROR", "Network packet transmission dropped during transaction", "network_issue"),
]

PAYMENT_METHODS = ["card", "upi", "netbanking", "wallet"]


def _normalize_customer(customer: Any) -> dict:
    if isinstance(customer, dict):
        return customer
    cust_id = str(customer)
    return {
        "name": cust_id,
        "email": f"{cust_id}@example.com",
        "phone": "+919876543210"
    }


def create_failed_payment_event(customer: Any, amount_inr: float) -> dict:
    c = _normalize_customer(customer)
    event_id = f"evt_{uuid.uuid4().hex[:14]}"
    pay_id = f"pay_{uuid.uuid4().hex[:14]}"
    cust_id = f"cust_{hashlib.md5(c['email'].encode()).hexdigest()[:10]}"
    err_code, err_desc, err_reason = random.choice(FAILURE_REASONS)
    method = random.choice(PAYMENT_METHODS)
    amount_paise = int(amount_inr * 100)

    return {
        "entity": "event",
        "account_id": "acc_recoverflow_live",
        "event": "payment.failed",
        "event_id": event_id,
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "entity": "payment",
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "failed",
                    "order_id": f"order_{uuid.uuid4().hex[:12]}",
                    "invoice_id": None,
                    "international": False,
                    "method": method,
                    "amount_refunded": 0,
                    "refund_status": None,
                    "captured": False,
                    "description": "RecoverFlow Enterprise Subscription Billing",
                    "card_id": f"card_{uuid.uuid4().hex[:10]}" if method == "card" else None,
                    "bank": "HDFC" if method in ("netbanking", "card") else None,
                    "wallet": None,
                    "vpa": f"{c['email'].split('@')[0]}@okhdfcbank" if method == "upi" else None,
                    "email": c["email"],
                    "contact": c["phone"],
                    "customer_id": cust_id,
                    "notes": {"plan": "enterprise_recovery", "customer_name": c["name"]},
                    "error_code": err_code,
                    "error_description": err_desc,
                    "error_source": "bank",
                    "error_step": "payment_authentication",
                    "error_reason": err_reason,
                    "created_at": int(time.time())
                }
            }
        },
        "created_at": int(time.time())
    }


def create_captured_payment_event(customer: Any, amount_inr: float) -> dict:
    c = _normalize_customer(customer)
    event_id = f"evt_{uuid.uuid4().hex[:14]}"
    pay_id = f"pay_{uuid.uuid4().hex[:14]}"
    cust_id = f"cust_{hashlib.md5(c['email'].encode()).hexdigest()[:10]}"
    method = random.choice(PAYMENT_METHODS)
    amount_paise = int(amount_inr * 100)

    return {
        "entity": "event",
        "account_id": "acc_recoverflow_live",
        "event": "payment.captured",
        "event_id": event_id,
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": pay_id,
                    "entity": "payment",
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "captured",
                    "method": method,
                    "customer_id": cust_id,
                    "email": c["email"],
                    "contact": c["phone"],
                    "created_at": int(time.time())
                }
            }
        },
        "created_at": int(time.time())
    }


def create_payment_link_paid_event(customer: Any, amount_inr: float) -> dict:
    c = _normalize_customer(customer)
    event_id = f"evt_{uuid.uuid4().hex[:14]}"
    plink_id = f"plink_{uuid.uuid4().hex[:14]}"
    pay_id = f"pay_{uuid.uuid4().hex[:14]}"
    cust_id = f"cust_{hashlib.md5(c['email'].encode()).hexdigest()[:10]}"
    amount_paise = int(amount_inr * 100)

    return {
        "entity": "event",
        "account_id": "acc_recoverflow_live",
        "event": "payment_link.paid",
        "event_id": event_id,
        "contains": ["payment_link", "payment"],
        "payload": {
            "payment_link": {
                "entity": {
                    "id": plink_id,
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "paid",
                    "customer": {
                        "id": cust_id,
                        "email": c["email"],
                        "contact": c["phone"]
                    },
                    "created_at": int(time.time())
                }
            },
            "payment": {
                "entity": {
                    "id": pay_id,
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi",
                    "customer_id": cust_id,
                    "created_at": int(time.time())
                }
            }
        },
        "created_at": int(time.time())
    }



def create_stripe_event(customer: dict, amount_inr: float, event_type: str = "payment_intent.payment_failed") -> dict:
    event_id = f"evt_stripe_{uuid.uuid4().hex[:14]}"
    cust_id = f"cus_{uuid.uuid4().hex[:12]}"
    amount_cents = int(amount_inr * 100)

    if event_type == "invoice.payment_failed":
        return {
            "id": event_id,
            "object": "event",
            "type": "invoice.payment_failed",
            "data": {
                "object": {
                    "id": f"in_{uuid.uuid4().hex[:12]}",
                    "customer": cust_id,
                    "customer_email": customer["email"],
                    "customer_name": customer["name"],
                    "amount_due": amount_cents,
                    "currency": "inr",
                    "status": "open",
                    "attempt_count": 1
                }
            },
            "created": int(time.time())
        }
    elif event_type == "checkout.session.abandoned":
        return {
            "id": event_id,
            "object": "event",
            "type": "checkout.session.abandoned",
            "data": {
                "object": {
                    "id": f"cs_{uuid.uuid4().hex[:12]}",
                    "customer": cust_id,
                    "customer_details": {
                        "email": customer["email"],
                        "name": customer["name"],
                        "phone": customer["phone"]
                    },
                    "amount_total": amount_cents,
                    "currency": "inr",
                    "status": "expired"
                }
            },
            "created": int(time.time())
        }
    else:
        return {
            "id": event_id,
            "object": "event",
            "type": "payment_intent.payment_failed",
            "data": {
                "object": {
                    "id": f"pi_{uuid.uuid4().hex[:12]}",
                    "customer": cust_id,
                    "receipt_email": customer["email"],
                    "amount": amount_cents,
                    "currency": "inr",
                    "status": "requires_payment_method",
                    "last_payment_error": {
                        "code": "card_declined",
                        "message": "Your card was declined due to insufficient funds.",
                        "decline_code": "insufficient_funds"
                    }
                }
            },
            "created": int(time.time())
        }


def sign_razorpay(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


# Backward compatibility alias
sign_payload = sign_razorpay


def sign_stripe(payload_bytes: bytes, secret: str) -> str:

    timestamp = int(time.time())
    sig_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    signature = hmac.new(secret.encode("utf-8"), sig_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={signature}"


def send_event(payload_dict: dict, url: str, secret: str, is_stripe: bool = False) -> requests.Response:
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    
    if is_stripe:
        signature = sign_stripe(payload_bytes, secret)
        headers = {
            "Content-Type": "application/json",
            "Stripe-Signature": signature,
            "User-Agent": "Stripe-Webhook-Simulator/1.0"
        }
    else:
        signature = sign_razorpay(payload_bytes, secret)
        headers = {
            "Content-Type": "application/json",
            "X-Razorpay-Signature": signature,
            "User-Agent": "Razorpay-Webhook-Simulator/1.0"
        }

    return requests.post(url, data=payload_bytes, headers=headers, timeout=10)


def main():
    parser = argparse.ArgumentParser(description="RecoverFlow Synthetic Multi-Gateway Event Simulator")
    parser.add_argument("--count", type=int, default=10, help="Number of events to generate")
    parser.add_argument("--source", type=str, default="mixed", choices=["razorpay", "stripe", "mixed"], help="Gateway source")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between requests in seconds")

    args = parser.parse_args()

    print(f"🚀 [RecoverFlow Simulator] Launching synthetic event generation...")
    print(f"   Count:      {args.count}")
    print(f"   Source:     {args.source}\n")

    amounts = [499.0, 999.0, 1499.0, 2499.0, 4999.0, 9999.0, 15000.0, 25000.0, 65000.0, 120000.0]
    success_count = 0

    for i in range(args.count):
        cust = random.choice(INDIAN_CUSTOMERS)
        amt = random.choice(amounts)
        gateway = args.source
        if gateway == "mixed":
            gateway = random.choice(["razorpay", "razorpay", "stripe"])

        if gateway == "stripe":
            stripe_type = random.choice(["payment_intent.payment_failed", "invoice.payment_failed", "checkout.session.abandoned"])
            payload = create_stripe_event(cust, amt, stripe_type)
            url = DEFAULT_STRIPE_URL
            secret = DEFAULT_STRIPE_SECRET
            is_stripe = True
            event_label = f"STRIPE: {stripe_type}"
        else:
            rzp_type = random.choice(["payment.failed", "payment.failed", "payment.captured", "payment_link.paid"])
            if rzp_type == "payment.failed":
                payload = create_failed_payment_event(cust, amt)
            elif rzp_type == "payment.captured":
                payload = create_captured_payment_event(cust, amt)
            else:
                payload = create_payment_link_paid_event(cust, amt)
            url = DEFAULT_WEBHOOK_URL
            secret = DEFAULT_SECRET
            is_stripe = False
            event_label = f"RAZORPAY: {rzp_type}"

        try:
            resp = send_event(payload, url, secret, is_stripe=is_stripe)
            if resp.status_code == 200:
                success_count += 1
                print(f"✅ [{i+1}/{args.count}] {event_label:<32} | {cust['name']:<18} | ₹{amt:>10.2f} | 200 OK")
            else:
                print(f"⚠️ [{i+1}/{args.count}] {event_label:<32} | Status: {resp.status_code} | {resp.text}")
        except Exception as e:
            print(f"❌ [{i+1}/{args.count}] Failed: {e}")

        if args.delay > 0 and i < args.count - 1:
            time.sleep(args.delay)

    print(f"\n✨ [Simulator] Complete! Successfully dispatched {success_count}/{args.count} events.")


if __name__ == "__main__":
    main()
