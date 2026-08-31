import os
import requests
import razorpay

def load_keys():
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        with open(".env") as f:
            for line in f:
                if line.startswith("RAZORPAY_KEY_ID="):
                    key_id = line.split("=", 1)[1].strip()
                elif line.startswith("RAZORPAY_KEY_SECRET="):
                    key_secret = line.split("=", 1)[1].strip()
    return key_id, key_secret

def get_ngrok_url():
    try:
        resp = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=5)
        tunnels = resp.json().get("tunnels", [])
        for t in tunnels:
            if t.get("proto") == "https":
                return t["public_url"]
        return None
    except Exception as e:
        print(f"Ngrok URL fetch error: {e}")
        return None

def main():
    key_id, key_secret = load_keys()
    if not key_id or not key_secret:
        print("Razorpay keys not found in .env")
        return

    client = razorpay.Client(auth=(key_id, key_secret))

    # 1. Get current ngrok URL
    ngrok_url = get_ngrok_url()
    if not ngrok_url:
        print("Ngrok not running or no https tunnel")
        return

    # Ensure correct path
    if not ngrok_url.endswith("/webhooks/razorpay"):
        ngrok_url = ngrok_url.rstrip("/") + "/webhooks/razorpay"
    print(f"Current ngrok URL: {ngrok_url}")

    # 2. Find webhook ID
    try:
        webhooks = client.webhook.all()
        webhook_id = None
        for wh in webhooks.get("items", []):
            if "/webhooks/razorpay" in wh.get("url", ""):
                webhook_id = wh["id"]
                break

        if not webhook_id:
            print("No webhook found with /webhooks/razorpay")
            return
        print(f"Found webhook ID: {webhook_id}")

        # 3. Update webhook URL
        result = client.webhook.edit(webhook_id, {"url": ngrok_url})
        print(f"Webhook updated successfully! New URL: {result['url']}")

    except Exception as e:
        print(f"Update failed: {e}")

if __name__ == "__main__":
    main()