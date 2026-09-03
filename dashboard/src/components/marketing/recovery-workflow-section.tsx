"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  Clock,
  WifiOff,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Check,
} from "lucide-react";

export function RecoveryWorkflowSection() {
  const [activeCase, setActiveCase] = useState<number>(0);

  const failureCategories = [
    {
      title: "Card decline",
      icon: CreditCard,
      badge: "Issuer decline",
      description: "Issuing bank declined card transaction. Merchant loses sale if customer is not immediately redirected.",
      strategy: "Instant UPI dynamic link or NetBanking fallback delivered via WhatsApp.",
    },
    {
      title: "Insufficient funds",
      icon: AlertTriangle,
      badge: "Soft balance failure",
      description: "Customer balance temporarily low. Retrying immediately burns attempts and increases failure score.",
      strategy: "Schedule automated retry aligned with month-end or salary cycle.",
    },
    {
      title: "3DS timeout",
      icon: Clock,
      badge: "User abandonment",
      description: "Customer delayed entering SMS OTP or bank app verification session timed out.",
      strategy: "WhatsApp recovery prompt with one-tap resumed checkout session.",
    },
    {
      title: "Bank timeout",
      icon: Building2,
      badge: "Acquirer downtime",
      description: "Acquirer bank rail latency exceeded 30-second gateway threshold.",
      strategy: "Automatic retry as soon as rail health telemetry normalizes.",
    },
    {
      title: "Network failure",
      icon: WifiOff,
      badge: "Transient dropped connection",
      description: "Packet drop during handshake between checkout client and Razorpay gateway.",
      strategy: "Idempotent immediate retry within safe duplicate-prevention window.",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Detect",
      action: "Razorpay Webhook",
      detail: "Captures raw payment.failed event within 40ms. Verifies cryptographic HMAC SHA-256 signature.",
    },
    {
      step: "02",
      title: "Diagnose",
      action: "Root Cause Classification",
      detail: "Identifies whether failure is transient (network), structural (limits), or soft (funds/card).",
    },
    {
      step: "03",
      title: "Decide",
      action: "Policy & Scoring",
      detail: "Calculates recoverability score (0–100%) and checks merchant policy ceilings before taking action.",
    },
    {
      step: "04",
      title: "Recover",
      action: "Multi-Rail Execution",
      detail: "Dispatches the safest recovery instrument: dynamic UPI payment link, smart retry, or WhatsApp notification.",
    },
    {
      step: "05",
      title: "Verify",
      action: "Ledger Audit",
      detail: "Reconciles recovery against Razorpay payment.captured and writes immutable audit entry.",
    },
  ];

  const recoveryCases = [
    {
      id: "card_to_upi",
      tabTitle: "Card decline → UPI link",
      paymentId: "RP_8F42A1",
      amount: "₹14,850",
      failureReason: "Card network decline",
      customer: "Rahul Mehta · 3 previous successful payments",
      diagnosis: "Customer card declined by issuing bank. Customer has verified UPI history.",
      policyCheck: "Allowed (Amount < ₹25,000, Risk = Low)",
      actionTaken: "Generated Razorpay UPI Payment Link & dispatched via WhatsApp",
      outcome: "Payment captured via PhonePe UPI in 1m 48s · ₹14,850 recovered",
      status: "RECOVERED",
    },
    {
      id: "insufficient_funds",
      tabTitle: "Insufficient funds → Salary retry",
      paymentId: "RP_9132AB",
      amount: "₹5,200",
      failureReason: "Insufficient funds (soft decline)",
      customer: "Priya Shah · Active monthly subscriber",
      diagnosis: "Declined on 28th. Customer historical cash inflow pattern indicates 1st-of-month liquidity.",
      policyCheck: "Allowed (Subscription cooldown: 48 hours)",
      actionTaken: "Scheduled smart retry for 1st at 09:15 AM IST",
      outcome: "Auto-retry executed successfully on 1st · ₹5,200 recovered without merchant ops",
      status: "RECOVERED",
    },
    {
      id: "gateway_timeout",
      tabTitle: "Gateway timeout → Safe retry",
      paymentId: "RP_42D90C",
      amount: "₹2,400",
      failureReason: "Acquirer gateway timeout (504)",
      customer: "Arjun Rao · First-time checkout",
      diagnosis: "Bank rail latency spiked to 3,200ms. Transient infrastructure degradation detected.",
      policyCheck: "Allowed (Idempotency key verified, rail back to healthy)",
      actionTaken: "Direct Razorpay order retry executed at 180ms rail normalization",
      outcome: "Transaction authorized instantly on retry · Zero duplicate debit",
      status: "RECOVERED",
    },
  ];

  return (
    <div id="how-it-works" className="space-y-24 py-20 bg-white border-b border-[#E5E9F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* SECTION 02: PROBLEM */}
        <section id="problem" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              02 · FAILURE TAXONOMY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Failed payments are not all the same.
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              A blanket retry strategy damages card authorization scores and irritates customers. RecoverFlow classifies every decline at ingestion to choose the single safest response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {failureCategories.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E5E9F0] bg-[#F8F9FC] space-y-3 hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E9F0] flex items-center justify-center text-[#0F172A]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-[#0F172A]">{item.title}</div>
                    <span className="inline-block text-[10px] font-mono text-[#5B6B84] bg-white px-1.5 py-0.5 rounded border border-[#E5E9F0]">
                      {item.badge}
                    </span>
                    <p className="text-[11px] text-[#5B6B84] leading-normal pt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E9F0] text-[10px] text-[#0F172A] font-medium leading-snug">
                    <span className="text-[#1E5EFF] block font-mono font-semibold uppercase text-[9px] mb-0.5">
                      Recovery Strategy:
                    </span>
                    {item.strategy}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 03: WORKFLOW */}
        <section id="workflow" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              03 · CORE ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              The 5-Step Revenue Recovery Workflow
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              From the millisecond a Razorpay decline fires to the moment recovered revenue hits your merchant account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-[#E5E9F0] bg-white space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#1E5EFF]">{step.step}</span>
                  {idx < 4 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden lg:block -mr-2" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#0F172A]">{step.title}</h3>
                  <div className="text-[11px] font-mono text-[#5B6B84]">{step.action}</div>
                </div>
                <p className="text-xs text-[#5B6B84] leading-relaxed pt-1">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 05: RECOVERY EXAMPLES */}
        <section id="examples" className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              05 · PRODUCTION SCENARIOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Three Realistic Recovery Cases
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              How RecoverFlow inspects customer history, checks policy guardrails, and picks alternative payment instruments.
            </p>
          </div>

          {/* Scenario Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E5E9F0] pb-2 overflow-x-auto">
            {recoveryCases.map((rc, idx) => (
              <button
                key={rc.id}
                onClick={() => setActiveCase(idx)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeCase === idx
                    ? "bg-[#0A2540] text-white"
                    : "text-[#5B6B84] hover:text-[#0F172A] hover:bg-slate-100"
                }`}
              >
                {rc.tabTitle}
              </button>
            ))}
          </div>

          {/* Active Case Card */}
          {(() => {
            const current = recoveryCases[activeCase];
            return (
              <div className="bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E9F0]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#0F172A]">{current.paymentId}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200">
                        {current.failureReason}
                      </span>
                    </div>
                    <div className="text-xs text-[#5B6B84]">{current.customer}</div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-2xl font-bold font-mono text-[#0F172A]">{current.amount}</div>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#008760]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recovered via RecoverFlow
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-lg border border-[#E5E9F0] space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#5B6B84] font-semibold block">
                      1. Ingestion &amp; Diagnosis
                    </span>
                    <p className="text-[#0F172A] leading-relaxed">
                      {current.diagnosis}
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-[#E5E9F0] space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#5B6B84] font-semibold block">
                      2. Policy Evaluation
                    </span>
                    <div className="flex items-center gap-1.5 text-[#008760] font-medium">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{current.policyCheck}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-[#E5E9F0] space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#5B6B84] font-semibold block">
                      3. Recovery Execution
                    </span>
                    <p className="text-[#0F172A] font-medium leading-relaxed">
                      {current.actionTaken}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    {current.outcome}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                    100% Reconciled
                  </span>
                </div>
              </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
}
