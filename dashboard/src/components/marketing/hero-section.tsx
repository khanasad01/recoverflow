"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  User,
  Zap,
  ArrowUpRight,
  Clock,
  RotateCw,
} from "lucide-react";

export function HeroSection() {
  const router = useRouter();
  const [recoveredState, setRecoveredState] = useState(false);

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 bg-[#F8F9FC] border-b border-[#E5E9F0] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Messaging */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight leading-[1.12]">
              Failed payments don&apos;t have to become lost revenue.
            </h1>

            <p className="text-base sm:text-lg text-[#5B6B84] font-normal leading-relaxed max-w-xl">
              RecoverFlow detects why a payment failed, evaluates the recovery opportunity, and selects the safest recovery action within the policies you define.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => router.push("/overview")}
                className="btn-pill-primary px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Open Recovery Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="#how-it-works"
                className="px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-white rounded-full border border-[#E5E9F0] text-center transition-colors shadow-2xs"
              >
                How it works
              </Link>
            </div>

            {/* Neutral Verification Indicators */}
            <div className="pt-6 border-t border-[#E5E9F0] flex flex-wrap items-center gap-3 text-xs text-[#5B6B84]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E9F0] font-mono text-[11px] text-[#0F172A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
                Demo environment
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E9F0] font-mono text-[11px] text-[#0F172A]">
                Simulated payment events
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E9F0] font-mono text-[11px] text-[#0F172A]">
                Razorpay webhook ingestion
              </span>
            </div>
          </div>

          {/* Right Column: Realistic Recovery Console Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#E5E9F0] rounded-xl shadow-sm overflow-hidden text-xs">
              {/* Window Titlebar */}
              <div className="px-4 py-3 bg-[#F8F9FC] border-b border-[#E5E9F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5E9F0]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5E9F0]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5E9F0]" />
                  </div>
                  <span className="text-[11px] font-mono text-[#5B6B84] ml-2">
                    console / opportunity / RP_8F42A1
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-medium">
                  <Clock className="w-3 h-3" />
                  <span>ACTION REQUIRED</span>
                </div>
              </div>

              {/* Main Card Content */}
              <div className="p-5 space-y-4">
                {/* Header: Payment ID & Amount */}
                <div className="flex items-start justify-between pb-3 border-b border-[#E5E9F0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0F172A]">RP_8F42A1</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200">
                        FAILED
                      </span>
                    </div>
                    <p className="text-[#5B6B84] text-[11px] mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      Reason: <span className="font-medium text-[#0F172A]">Card network decline</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-[#0F172A]">₹14,850.00</div>
                    <span className="text-[10px] font-mono text-[#5B6B84]">INR · HDFC Gateway</span>
                  </div>
                </div>

                {/* Customer Context Card */}
                <div className="p-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#5B6B84] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#1E5EFF]" /> Customer Profile
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#008760] bg-[#00C48C]/10 px-1.5 py-0.2 rounded">
                      LOW RISK
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-medium text-[#0F172A]">
                    <span>Rahul Mehta</span>
                    <span className="text-[11px] font-mono text-[#5B6B84]">3 previous successful payments</span>
                  </div>
                </div>

                {/* Recommendation Rail */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900 flex items-center gap-1.5 text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-[#1E5EFF]" /> Recommended Recovery Action
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#1E5EFF]">
                      88% Probability
                    </span>
                  </div>

                  <div className="text-[12px] text-[#0F172A]">
                    Switch to <strong className="text-[#1E5EFF]">UPI payment link</strong> delivered via WhatsApp & SMS.
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-[#5B6B84] font-mono border-t border-blue-100">
                    <span>Expected Recovery Value:</span>
                    <strong className="text-[#0F172A]">₹14,850</strong>
                  </div>
                </div>

                {/* Policy Guardrail Checks */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono font-semibold text-[#5B6B84] uppercase tracking-wider">
                    Deterministic Policy Checks
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white border border-[#E5E9F0] rounded flex items-center gap-1.5 text-[#0F172A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C] flex-shrink-0" />
                      <span className="truncate">Amount limit</span>
                    </div>
                    <div className="p-2 bg-white border border-[#E5E9F0] rounded flex items-center gap-1.5 text-[#0F172A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C] flex-shrink-0" />
                      <span className="truncate">Retry limit</span>
                    </div>
                    <div className="p-2 bg-white border border-[#E5E9F0] rounded flex items-center gap-1.5 text-[#0F172A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C] flex-shrink-0" />
                      <span className="truncate">Customer risk</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-[#5B6B84]">Policy status:</span>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[#008760] text-[10px] bg-[#00C48C]/10 px-2 py-0.5 rounded border border-[#00C48C]/20">
                      <ShieldCheck className="w-3 h-3" /> AUTO-ELIGIBLE
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2.5">
                  {recoveredState ? (
                    <div className="w-full py-2.5 px-3 bg-[#00C48C]/10 border border-[#00C48C]/30 rounded-lg text-center font-semibold text-[#008760] text-xs flex items-center justify-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recovery Link Dispatched · UPI Intent Created</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setRecoveredState(true)}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-[#1E5EFF] hover:bg-[#1649D8] text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Recover payment</span>
                      </button>
                      <button
                        onClick={() => router.push("/opportunities?q=RP_8F42A1")}
                        className="py-2.5 px-4 rounded-lg border border-[#E5E9F0] hover:bg-slate-50 text-[#0F172A] font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Review</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#5B6B84]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
