import os
import requests
import json

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
        for t in resp.json().get("tunnels", []):
            if t.get("proto") == "https":
                return t["public_url"]
        return None
    except Exception as e:
        print(f"Ngrok error: {e}")
        return None

def main():
    key_id, key_secret = load_keys()
    ngrok_url = get_ngrok_url()
    if not ngrok_url:
        print("Ngrok not running")
        return

    if not ngrok_url.endswith("/webhooks/razorpay"):
        ngrok_url = ngrok_url.rstrip("/") + "/webhooks/razorpay"
    print("New URL:", ngrok_url)

    # Find webhook ID
    list_url = "https://api.razorpay.com/v1/webhooks"
    resp = requests.get(list_url, auth=(key_id, key_secret))
    if resp.status_code != 200:
        print(f"List webhooks failed: {resp.status_code} - {resp.text}")
        return

    webhook_id = None
    for wh in resp.json().get("items", []):
        if "/webhooks/razorpay" in wh.get("url", ""):
            webhook_id = wh["id"]
            break
    if not webhook_id:
        print("Webhook not found")
        return
    print("Webhook ID:", webhook_id)

    # Update using PUT
    update_url = f"https://api.razorpay.com/v1/webhooks/{webhook_id}"
    data = {"url": ngrok_url}
    print("Sending PUT to:", update_url)
    resp = requests.put(update_url, json=data, auth=(key_id, key_secret))
    print("Status Code:", resp.status_code)
    print("Response:", resp.text)

if __name__ == "__main__":
    main()