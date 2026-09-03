"use client";

import React, { useState } from "react";
import {
  Webhook,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

export function RazorpayIntegrationSection() {
  const [activeTab, setActiveTab] = useState<string>("ts");
  const [copied, setCopied] = useState<boolean>(false);

  const codeSnippets: Record<string, { lang: string; title: string; code: string }> = {
    ts: {
      lang: "typescript",
      title: "webhook-handler.ts",
      code: `import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

// 1. Ingest Razorpay decline events with HMAC SHA-256 verification
app.post("/webhooks/razorpay", (req, res) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid webhook signature");
  }

  const event = req.body.event;

  // 2. Route failure event into RecoverFlow engine
  if (event === "payment.failed") {
    const payment = req.body.payload.payment.entity;
    console.log(\`[RecoverFlow] Ingesting decline: \${payment.id} (\${payment.error_code})\`);
    
    // Engine evaluates customer history, policy limits, and generates UPI link
  }

  res.status(200).json({ status: "received" });
});`,
    },
    py: {
      lang: "python",
      title: "recovery_listener.py",
      code: `import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    
    # 1. Verify HMAC SHA-256 signature
    secret = b"your_razorpay_webhook_secret"
    expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    if signature != expected:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_data = await request.json()
    
    # 2. payment.failed -> RecoverFlow diagnosis -> policy check -> UPI recovery
    if event_data.get("event") == "payment.failed":
        payment = event_data["payload"]["payment"]["entity"]
        # Trigger autonomous recovery rail
        print(f"Triggering recovery for: {payment['id']}, amount: {payment['amount']}")
        
    return {"status": "ok"}`,
    },
    curl: {
      lang: "bash",
      title: "trigger_recovery.sh",
      code: `# Test simulated recovery dispatch on decline event RP_8F42A1
curl -X POST https://api.recoverflow.com/api/v1/opportunities/opp_8F42A1/action \\
  -H "Authorization: Bearer <MERCHANT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action_type": "payment_link",
    "delivery_rail": "whatsapp",
    "reason": "Card network decline; customer has verified UPI history"
  }'

# Response:
# {
#   "status": "EXECUTED",
#   "external_ref": "plink_8F42A1",
#   "action_type": "payment_link",
#   "created_at": "2026-09-04T03:42:23Z"
# }`,
    },
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const eventTypes = [
    {
      name: "payment.failed",
      badge: "Primary Trigger",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      description: "Ingests payment decline. Evaluates root cause, scoring, and policy ceilings within 40ms.",
    },
    {
      name: "payment.authorized",
      badge: "Conversion Monitor",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Tracks customer authorization state on fallback UPI or card retry rail.",
    },
    {
      name: "payment.captured",
      badge: "Reconciliation",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Reconciles recovery. Marks opportunity RECOVERED in ledger and updates lift metrics.",
    },
    {
      name: "refund.created",
      badge: "Net Accounting",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      description: "Monitors refund events to adjust net recovered revenue accurately.",
    },
  ];

  return (
    <div id="integrations" className="space-y-24 py-20 bg-white border-b border-[#E5E9F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* SECTION 09: RAZORPAY INTEGRATION */}
        <section className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              09 · RAZORPAY WORKFLOW INTEGRATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Engineered natively for Razorpay merchants.
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              Zero changes required to your existing checkout or payment gateway integration. Connect via Razorpay webhooks in under five minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Webhook Status Box (5 cols) */}
            <div className="lg:col-span-5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-[#1E5EFF]" />
                  <span className="font-semibold text-xs text-[#0F172A]">Razorpay Webhook Rail</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#008760] bg-[#00C48C]/10 px-2 py-0.5 rounded border border-[#00C48C]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" /> CONNECTED
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#5B6B84] text-[10px] font-mono uppercase block">Webhook Ingestion URL</span>
                  <code className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#E5E9F0] text-[#0F172A] block mt-1 truncate">
                    https://api.recoverflow.com/api/v1/webhooks/razorpay
                  </code>
                </div>

                <div>
                  <span className="text-[#5B6B84] text-[10px] font-mono uppercase block">Cryptographic Security</span>
                  <div className="flex items-center gap-1.5 text-[#0F172A] font-mono text-[11px] mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00C48C]" />
                    <span>HMAC SHA-256 verified per payload</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#5B6B84] text-[10px] font-mono uppercase block">Environments Supported</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-[#E5E9F0] text-[#0F172A]">
                      Live Production
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-[#E5E9F0] text-[#5B6B84]">
                      Test Sandbox
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E9F0] text-[11px] text-[#5B6B84]">
                Events stream asynchronously without adding latency to merchant checkout.
              </div>
            </div>

            {/* Right: Ingested Event Types (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase tracking-wider block">
                MONITORED RAZORPAY EVENT TYPES
              </span>
              <div className="space-y-2.5">
                {eventTypes.map((et, i) => (
                  <div key={i} className="p-3 bg-white border border-[#E5E9F0] rounded-xl flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0F172A]">{et.name}</span>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${et.badgeColor}`}>
                          {et.badge}
                        </span>
                      </div>
                      <p className="text-[#5B6B84] text-[11px]">
                        {et.description}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#00C48C] shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: DEVELOPER EXPERIENCE */}
        <section id="developer" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              10 · DEVELOPER EXPERIENCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Transparent webhook lifecycle in code.
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              Listen to decline webhooks, let RecoverFlow evaluate policies, and subscribe to reconciliation events with clean standard libraries.
            </p>
          </div>

          <div className="bg-[#0A2540] rounded-xl border border-[#1D3152] overflow-hidden text-xs shadow-sm">
            {/* Terminal Header */}
            <div className="px-4 py-3 bg-[#0B1B33] border-b border-[#1D3152] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-slate-300 text-[11px]">
                  {codeSnippets[activeTab].title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#0D2D52] rounded-lg p-0.5 border border-slate-700">
                  <button
                    onClick={() => setActiveTab("ts")}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                      activeTab === "ts" ? "bg-[#1E5EFF] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    TypeScript
                  </button>
                  <button
                    onClick={() => setActiveTab("py")}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                      activeTab === "py" ? "bg-[#1E5EFF] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setActiveTab("curl")}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                      activeTab === "curl" ? "bg-[#1E5EFF] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(codeSnippets[activeTab].code)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-[11px] leading-relaxed overflow-x-auto text-slate-200">
              <pre>
                <code>{codeSnippets[activeTab].code}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
