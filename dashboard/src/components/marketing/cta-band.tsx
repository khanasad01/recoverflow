"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export function CtaBand() {
  return (
    <section id="pricing" className="py-20 lg:py-24 bg-[#F8F9FC]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#0A2540] text-white p-10 sm:p-14 lg:p-16 border border-[#1D3152] text-center space-y-6 max-w-4xl mx-auto shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-semibold text-[#3395FF] uppercase tracking-wider">
            <span>RAZORPAY PAYMENT RECOVERY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Recover more revenue from every payment flow.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Connect your Razorpay webhooks in minutes, configure deterministic policy guardrails, and start recovering failed transactions automatically.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/overview"
              className="btn-pill-primary px-7 py-3 text-sm font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Open Recovery Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="#developer"
              className="px-6 py-3 text-sm font-semibold w-full sm:w-auto text-center text-white border border-white/20 hover:bg-white/10 rounded-full transition-colors"
            >
              View API Documentation
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-white/10 mt-6">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
              Zero changes to existing checkout
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3395FF]" />
              Deterministic policy ceilings
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
              Full audit trail per event
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
