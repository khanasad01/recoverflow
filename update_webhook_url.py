import os
import requests

def get_ngrok_url():
    """Ngrok local API se current public https URL fetch karo."""
    try:
        resp = requests.get("http://127.0.0.1:4040/api/tunnels")
        data = resp.json()
        for tunnel in data.get("tunnels", []):
            if tunnel.get("proto") == "https":
                return tunnel["public_url"]
        raise Exception("No https tunnel found")
    except Exception as e:
        print(f"Error fetching ngrok URL: {e}")
        return None

def get_webhook_id():
    """Razorpay se webhooks list karke correct webhook id find karo (URL contains /webhooks/razorpay)."""
    key_id, key_secret = load_razorpay_keys()
    if not key_id or not key_secret:
        print("Razorpay keys not found")
        return None

    url = "https://api.razorpay.com/v1/webhooks"
    try:
        resp = requests.put(url, json=data, auth=auth)
        if resp.status_code == 200:
            items = resp.json().get("items", [])
            for wh in items:
                if "/webhooks/razorpay" in wh.get("url", ""):
                    return wh.get("id")
            print("No webhook found with /webhooks/razorpay in URL")
            return None
        else:
            print(f"Failed to fetch webhooks: {resp.status_code} - {resp.text}")
            return None
    except Exception as e:
        print(f"Request failed: {e}")
        return None

def load_razorpay_keys():
    """.env file se keys read karo, environment se fallback."""
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        # .env file se try karo
        try:
            with open(".env") as f:
                for line in f:
                    if line.startswith("RAZORPAY_KEY_ID="):
                        key_id = line.split("=", 1)[1].strip()
                    elif line.startswith("RAZORPAY_KEY_SECRET="):
                        key_secret = line.split("=", 1)[1].strip()
        except FileNotFoundError:
            print(".env file not found")
    return key_id, key_secret

def update_webhook_url(webhook_id, new_url):
    """Razorpay webhook URL update karo using PATCH."""
    key_id, key_secret = load_razorpay_keys()
    if not key_id or not key_secret:
        print("Razorpay keys not found")
        return

    url = f"https://api.razorpay.com/v1/webhooks/{webhook_id}"
    auth = (key_id, key_secret)
    data = {"url": new_url}
    try:
        resp = requests.patch(url, json=data, auth=auth)
        if resp.status_code == 200:
            print(f"Webhook updated successfully to: {new_url}")
        else:
            print(f"Failed to update webhook: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # 1. Get current ngrok URL
    ngrok_url = get_ngrok_url()
    if not ngrok_url:
        print("Ngrok not running or URL not found")
        exit(1)

    # Ensure URL ends with /webhooks/razorpay
    if not ngrok_url.endswith("/webhooks/razorpay"):
        ngrok_url = ngrok_url.rstrip("/") + "/webhooks/razorpay"

    print(f"Current ngrok URL: {ngrok_url}")

    # 2. Get webhook ID dynamically
    webhook_id = get_webhook_id()
    if not webhook_id:
        print("Could not find webhook ID")
        exit(1)

    print(f"Found webhook ID: {webhook_id}")

    # 3. Update webhook URL
    update_webhook_url(webhook_id, ngrok_url)