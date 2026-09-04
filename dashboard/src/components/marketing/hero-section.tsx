"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  RotateCw,
  FileCheck2,
} from "lucide-react";

export function HeroSection() {
  const router = useRouter();
  const [recoveredState, setRecoveredState] = useState(false);

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 bg-[#FFFFFF] border-b border-[#E5E9F0] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Messaging */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs font-mono font-semibold uppercase tracking-wider">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
              <span>PAYMENT RECOVERY INFRASTRUCTURE</span>
            </div>

            <h1 className="text-[38px] sm:text-[46px] lg:text-[56px] font-bold text-[#0F172A] tracking-tight leading-[1.08] max-w-[580px]">
              Failed payments don&apos;t have to become lost revenue.
            </h1>

            <p className="text-base sm:text-lg text-[#5B6B84] font-normal leading-relaxed max-w-[540px]">
              RecoverFlow detects why a payment failed, evaluates the recovery opportunity, and selects the safest recovery action within the policies you define.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => router.push("/overview")}
                className="px-6 py-3 text-sm font-semibold rounded-lg bg-[#0A2540] hover:bg-[#123359] text-white border border-[#1D3152] shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 group"
              >
                <span>Open Recovery Console</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <Link
                href="#how-it-works"
                className="px-5 py-3 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 hover:border-[#CBD5E1] rounded-lg border border-[#E5E9F0] text-center transition-all shadow-2xs"
              >
                See how it works →
              </Link>
            </div>

            {/* Supporting Metadata */}
            <div className="pt-6 border-t border-[#E5E9F0] flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#5B6B84] font-mono">
              <span className="text-[#0F172A] font-semibold">Razorpay events</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#0F172A] font-semibold">Policy-driven automation</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#0F172A] font-semibold">Full audit trail</span>
            </div>
          </div>

          {/* Right Column: Realistic Recovery Console Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#E5E9F0] rounded-xl shadow-xs overflow-hidden text-xs">
              {/* Window Header */}
              <div className="px-4 py-2.5 bg-[#F8F9FC] border-b border-[#E5E9F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#5B6B84] ml-2">
                    RECOVERY CONSOLE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#5B6B84]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                  <span>Real-time Ingestion</span>
                </div>
              </div>

              {/* Main Card Content */}
              <div className="p-5 space-y-4">
                {/* Header: Payment ID & Amount */}
                <div className="flex items-start justify-between pb-3 border-b border-[#E5E9F0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0F172A]">Payment #RP_8F42A1</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200">
                        FAILED
                      </span>
                    </div>
                    <p className="text-[#5B6B84] text-[11px] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span>Card network decline</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-[#0F172A]">₹14,850</div>
                    <span className="text-[10px] font-mono text-[#5B6B84]">INR · HDFC Gateway</span>
                  </div>
                </div>

                {/* RECOVERY CONTEXT */}
                <div className="p-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6B84] flex items-center justify-between">
                    <span>RECOVERY CONTEXT</span>
                    <span className="text-[#008760] font-semibold bg-[#00C48C]/10 px-1.5 py-0.2 rounded text-[9px]">
                      LOW RISK
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#5B6B84] block text-[10px]">Customer:</span>
                      <span className="font-semibold text-[#0F172A]">Rahul Mehta</span>
                    </div>
                    <div>
                      <span className="text-[#5B6B84] block text-[10px]">Risk:</span>
                      <span className="font-semibold text-[#008760]">Low</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#5B6B84] block text-[10px]">Previous successful payments:</span>
                      <span className="font-mono font-semibold text-[#0F172A]">3</span>
                    </div>
                  </div>
                </div>

                {/* RECOMMENDED ACTION */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#1E5EFF]" /> RECOMMENDED ACTION
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#1E5EFF]">
                      88% Recovery Probability
                    </span>
                  </div>

                  <div className="text-[12px] text-[#0F172A] font-medium">
                    Switch to UPI payment link
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-[#5B6B84] font-mono border-t border-blue-100/80">
                    <span>Expected recovered value:</span>
                    <strong className="text-[#0F172A] font-bold">₹14,850</strong>
                  </div>
                </div>

                {/* POLICY */}
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase tracking-wider">
                      POLICY
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[#008760] text-[10px] bg-[#00C48C]/10 px-2 py-0.5 rounded border border-[#00C48C]/20">
                      <ShieldCheck className="w-3 h-3" /> AUTO-ELIGIBLE
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-[#F8F9FC] border border-[#E5E9F0] rounded flex items-center justify-between">
                      <span className="text-[#5B6B84]">Amount limit</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                    </div>
                    <div className="p-2 bg-[#F8F9FC] border border-[#E5E9F0] rounded flex items-center justify-between">
                      <span className="text-[#5B6B84]">Retry limit</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                    </div>
                    <div className="p-2 bg-[#F8F9FC] border border-[#E5E9F0] rounded flex items-center justify-between">
                      <span className="text-[#5B6B84]">Customer risk</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons & Audit Notice */}
                <div className="pt-2 space-y-2">
                  {recoveredState ? (
                    <div className="w-full py-2.5 px-3 bg-[#00C48C]/10 border border-[#00C48C]/30 rounded-lg text-center font-semibold text-[#008760] text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment link generated · UPI intent dispatched</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setRecoveredState(true)}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-[#1E5EFF] hover:bg-[#1649D8] text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Recover payment</span>
                      </button>
                      <button
                        onClick={() => router.push("/opportunities?q=RP_8F42A1")}
                        className="py-2.5 px-4 rounded-lg border border-[#E5E9F0] hover:bg-slate-50 text-[#0F172A] font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>Review</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#5B6B84]" />
                      </button>
                    </div>
                  )}

                  <div className="text-center text-[10px] text-[#5B6B84] font-mono flex items-center justify-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-[#5B6B84]" />
                    <span>Action will be recorded in audit trail</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
