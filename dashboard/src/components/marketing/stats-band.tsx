"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Zap } from "lucide-react";

export function StatsBand() {
  const stats = [
    {
      value: "Simulated",
      label: "Sandbox Payment Events",
      detail: "Webhook payload ingestion testing with synthetic declined transactions",
    },
    {
      value: "100%",
      label: "Deterministic Policy Checks",
      detail: "Safety ceilings and retry limits validated before agent dispatch",
    },
    {
      value: "184ms",
      label: "Target Pipeline Latency",
      detail: "Median event evaluation from webhook receipt to recovery intent",
    },
    {
      value: "3 Rails",
      label: "Active Recovery Adapters",
      detail: "Dynamic UPI payment links, smart card retry, and WhatsApp nudges",
    },
  ];

  return (
    <section id="stats" className="bg-[#0A2540] text-white py-16 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-mono font-semibold tracking-widest text-[#3395FF] uppercase">
            RECOVERY TELEMETRY
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Payment recovery workflow for Razorpay merchants
          </h2>
          <p className="text-sm text-slate-300">
            Engineered to detect declined transactions, evaluate recovery feasibility, and dispatch alternative rails safely.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10 border-b border-[#1D3152]">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1.5 text-center sm:text-left p-4 rounded-xl bg-[#0D2D52]/50 border border-slate-700/50">
              <div className="text-3xl font-bold font-mono tracking-tight text-white">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {stat.label}
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
            <span className="text-slate-200">Deterministic Safety Guardrails</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3395FF]" />
            <span className="text-slate-200">HMAC Webhook Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-slate-200">Automated UPI Fallback</span>
          </div>
        </div>
      </div>
    </section>
  );
}
