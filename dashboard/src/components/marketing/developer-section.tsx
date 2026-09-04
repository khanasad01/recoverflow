"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CODE_SNIPPETS: Record<string, { lang: string; code: string }> = {
  nodejs: {
    lang: "javascript",
    code: `import { RecoverFlow } from "@recoverflow/sdk";

const client = new RecoverFlow({
  keyId: "your_key_id_here",
  keySecret: "your_key_secret_here",
  enableAutonomousRecovery: true, // Auto-rescues soft declines
});

// 1. Create a dynamic order with instant smart routing
const order = await client.orders.create({
  amount: 499900, // ₹4,999 in paise
  currency: "INR",
  receipt: "rcpt_ord_90123",
  notes: { customer_tier: "enterprise" },
});

// 2. Listen to real-time recovery webhooks
client.webhooks.on("payment.recovered", (event) => {
  console.log(\`Rescued payment \${event.payment_id} via \${event.routing_rail}\`);
});`,
  },
  python: {
    lang: "python",
    code: `import recoverflow
import os

client = recoverflow.Client(
    auth=("your_key_id_here", "your_key_secret_here")
)

# 1. Create an enterprise order with ML routing enabled
order = client.order.create({
    "amount": 499900,  # ₹4,999 in paise
    "currency": "INR",
    "receipt": "rcpt_py_8819",
    "autonomous_recovery": {
        "enabled": True,
        "max_retry_window_seconds": 300,
        "fallback_rails": ["upi_intent", "netbanking_direct"]
    }
})

print(f"Order created: {order['id']}, status: {order['status']}")`,
  },
  curl: {
    lang: "bash",
    code: `curl -X POST https://api.recoverflow.com/v1/orders \\
  -u your_key_id_here:your_key_secret_here \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 499900,
    "currency": "INR",
    "receipt": "rcpt_curl_001",
    "smart_routing": {
      "strategy": "lowest_latency_highest_sr",
      "auto_recovery": true
    }
  }'`,
  },
  go: {
    lang: "go",
    code: `package main

import (
    "fmt"
    "github.com/recoverflow/sdk-go"
)

func main() {
    client := recoverflow.NewClient("your_key_id_here", "your_key_secret_here")

    order, err := client.Orders.Create(&recoverflow.OrderParams{
        Amount:   499900,
        Currency: "INR",
        Receipt:  "rcpt_go_99",
        EnableAutonomousRecovery: true,
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("Order initialized: %s\\n", order.ID)
}`,
  },
};

export function DeveloperSection() {
  const [activeLang, setActiveLang] = useState<string>("nodejs");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeLang].code);
    setCopied(true);
    toast.success("Code snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer" className="py-24 lg:py-32 bg-[#0B1B33] text-white relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1E5EFF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Developer Value Prop (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E5EFF]/15 text-[#3395FF] text-xs font-semibold uppercase tracking-wider font-mono">
              <Terminal className="w-3.5 h-3.5" />
              <span>DEVELOPER-FIRST APIS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              5 lines of code. 10 minutes to production.
            </h2>

            <p className="text-base text-slate-300 leading-relaxed">
              Engineered with clean REST semantics, strictly typed SDKs, idempotent mutations, cryptographic webhook signatures, and a full sandbox testing environment.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[#00C48C]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>SDKs for Node.js, Python, Go, Java, PHP, and Ruby</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-200">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[#00C48C]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>HMAC-SHA256 authenticated webhooks with auto-retry</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-200">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[#00C48C]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Simulated decline scenarios in mock sandbox environment</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 text-sm font-semibold rounded-lg bg-[#0A2540] hover:bg-[#123359] text-white border border-[#1D3152] shadow-xs inline-flex items-center gap-2 transition-colors"
              >
                <span>Read API Documentation</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Dark Code Editor (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#061224] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              {/* Code Editor Header / Language Tabs */}
              <div className="bg-[#0A1E3C] px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5 mr-3">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                    <span className="w-3 h-3 rounded-full bg-[#00C48C]/80" />
                  </div>

                  {(["nodejs", "python", "curl", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                        activeLang === lang
                          ? "bg-[#1E5EFF] text-white font-semibold shadow-xs"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {lang === "nodejs" ? "Node.js" : lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00C48C]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Snippet Box with Syntax Coloring */}
              <div className="p-5 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed text-slate-300">
                <pre className="whitespace-pre">
                  <code>{CODE_SNIPPETS[activeLang].code}</code>
                </pre>
              </div>

              {/* Code Editor Status Bar */}
              <div className="bg-[#0A1E3C]/60 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                  <span>Sandbox v2.4.0 • 0ms Latency Mock Rail</span>
                </span>
                <span>UTF-8</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
