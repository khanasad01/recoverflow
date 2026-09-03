"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Check,
  ChevronRight,
} from "lucide-react";

export function RecoveryControlSection() {
  const [selectedRule, setSelectedRule] = useState<number>(0);

  const merchantRules = [
    {
      id: "rule_card_upi",
      name: "CARD DECLINE → UPI FALLBACK",
      tag: "Rule #01 · High Volume",
      status: "Active",
      ifConditions: [
        "Failure Reason in ['card_declined', 'issuer_timeout']",
        "Amount < ₹25,000.00",
        "Customer Risk Profile == 'Low' or 'Medium'",
      ],
      thenAction: "Generate Razorpay UPI Payment Link & dispatch via WhatsApp notification",
      automation: "Automatic (Zero manual intervention)",
      limits: "Max 2 attempts · 30 min cooldown between links",
    },
    {
      id: "rule_high_val",
      name: "HIGH-VALUE HUMAN APPROVAL GATE",
      tag: "Rule #02 · Risk Ceiling",
      status: "Enforced",
      ifConditions: [
        "Amount >= ₹50,000.00",
        "Any failure reason",
      ],
      thenAction: "Halt automation · Hold in Recovery Queue for Human Review",
      automation: "Manual Review Required (Dual-operator authorization)",
      limits: "24-hour expiry window · Manager escalation after 2 hours",
    },
    {
      id: "rule_sub_retry",
      name: "SUBSCRIPTION SALARY-CYCLE RETRY",
      tag: "Rule #03 · Recurring Billing",
      status: "Active",
      ifConditions: [
        "Failure Reason == 'insufficient_funds'",
        "Product Type == 'recurring_subscription'",
      ],
      thenAction: "Delay card retry until merchant-configured salary window (1st to 5th)",
      automation: "Scheduled Automation (Cooldown: 48 hours)",
      limits: "Max 3 retries per monthly billing cycle",
    },
  ];

  const auditEvents = [
    { time: "03:42:19", event: "payment.failed", actor: "Razorpay Gateway", result: "Ingested", detail: "Payload signature verified (HMAC SHA-256)" },
    { time: "03:42:20", event: "Failure Classified", actor: "Classifier Engine", result: "card_declined", detail: "Issuing bank soft decline; terminal fraud excluded" },
    { time: "03:42:21", event: "Customer Profile Checked", actor: "Intelligence Store", result: "Low Risk", detail: "3 successful prior transactions; 0 chargebacks" },
    { time: "03:42:21", event: "Policy Guardrails Evaluated", actor: "Deterministic Engine", result: "Passed", detail: "Amount < ₹25,000 ✓ Cooldown ✓ Auto-eligible ✓" },
    { time: "03:42:22", event: "Action Rail Selected", actor: "Scoring Model", result: "UPI Payment Link", detail: "88% recovery probability; estimated EV ₹14,850" },
    { time: "03:42:23", event: "Payment Link Dispatched", actor: "Razorpay Adapter", result: "plink_8F42A1", detail: "Delivered via verified WhatsApp webhook rail" },
    { time: "03:44:07", event: "payment.captured", actor: "Razorpay Webhook", result: "Success", detail: "UPI Intent paid via PhonePe (UTR 489201940)" },
    { time: "03:44:08", event: "Recovery Reconciled", actor: "Ledger Engine", result: "RECOVERED", detail: "₹14,850 credited to merchant; marked closed" },
  ];

  return (
    <div id="features" className="space-y-24 py-20 bg-[#F8F9FC] border-b border-[#E5E9F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* SECTION 06: MERCHANT CONTROL (RECOVERY POLICIES) */}
        <section id="policy-control" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              06 · DETERMINISTIC GOVERNANCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Full merchant control over every recovery decision.
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              Define safety ceilings and retry limits ahead of time in deterministic YAML rules. Automated recovery triggers only when your exact criteria are satisfied.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Rule Selector List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {merchantRules.map((rule, idx) => (
                <div
                  key={rule.id}
                  onClick={() => setSelectedRule(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedRule === idx
                      ? "bg-white border-[#1E5EFF] shadow-xs"
                      : "bg-white/60 border-[#E5E9F0] hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase">
                      {rule.tag}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00C48C]/10 text-[#008760]">
                      {rule.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#0F172A] mt-1">
                    {rule.name}
                  </h3>
                  <div className="text-[11px] text-[#5B6B84] mt-1 flex items-center justify-between">
                    <span>{rule.automation.split("(")[0]}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedRule === idx ? "text-[#1E5EFF] translate-x-0.5" : "text-slate-400"}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Rule Detail Card (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#E5E9F0] rounded-xl p-6 space-y-5 shadow-xs">
              {(() => {
                const r = merchantRules[selectedRule];
                return (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
                      <div>
                        <div className="font-mono font-bold text-sm text-[#0F172A]">{r.name}</div>
                        <span className="text-[#5B6B84] text-[11px]">{r.tag}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00C48C]/10 text-[#008760] border border-[#00C48C]/30">
                        STATUS: {r.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase tracking-wider block">
                        IF (ALL CONDITIONS MET):
                      </span>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {r.ifConditions.map((cond, i) => (
                          <div key={i} className="p-2 bg-[#F8F9FC] border border-[#E5E9F0] rounded text-[#0F172A] flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#00C48C] shrink-0" />
                            <span>{cond}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase tracking-wider block">
                        THEN (RECOVERY ACTION):
                      </span>
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded text-[#0F172A] font-medium text-xs">
                        {r.thenAction}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t border-[#E5E9F0]">
                      <div>
                        <span className="text-[#5B6B84] block text-[10px] uppercase font-mono font-semibold">Mode</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">{r.automation}</span>
                      </div>
                      <div>
                        <span className="text-[#5B6B84] block text-[10px] uppercase font-mono font-semibold">Safety Limits</span>
                        <span className="font-semibold text-[#0F172A] mt-0.5 block">{r.limits}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* SECTION 07: AUDITABILITY (EVENT TIMELINE) */}
        <section id="audit" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              07 · ENTERPRISE AUDITABILITY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Immutable audit ledger for finance &amp; ops.
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              Every diagnostic classification, customer check, and webhook execution is recorded with millisecond timestamps, actors, and outcomes.
            </p>
          </div>

          <div className="bg-white border border-[#E5E9F0] rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 bg-[#F8F9FC] border-b border-[#E5E9F0] flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-[#0F172A]">Event Stream · Transaction #RP_8F42A1</span>
              <span className="font-mono text-[11px] text-[#008760] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 8 Lifecycle Events Recorded
              </span>
            </div>

            <div className="divide-y divide-[#E5E9F0] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FC] text-[#5B6B84] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Result</th>
                    <th className="py-2.5 px-4">Audit Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9F0] font-mono text-[11px]">
                  {auditEvents.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-[#5B6B84] whitespace-nowrap">{ev.time} IST</td>
                      <td className="py-2.5 px-4 font-semibold text-[#0F172A] whitespace-nowrap">{ev.event}</td>
                      <td className="py-2.5 px-4 text-[#5B6B84] whitespace-nowrap">{ev.actor}</td>
                      <td className="py-2.5 px-4 font-bold text-[#1E5EFF] whitespace-nowrap">{ev.result}</td>
                      <td className="py-2.5 px-4 text-[#5B6B84] font-sans text-xs">{ev.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 08: REVENUE ANALYTICS */}
        <section id="analytics" className="space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1E5EFF]">
              08 · FINANCIAL TELEMETRY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Analytics built to answer real CFO questions.
            </h2>
            <p className="text-sm text-[#5B6B84] leading-relaxed">
              No vanity metrics or decorative graphs. Clear quantification of at-risk gross volume, policy-eligible recovery, and realized incremental revenue.
            </p>
          </div>

          {/* 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-mono uppercase text-[#5B6B84] font-semibold block">
                Failed Gross Volume (GMV)
              </span>
              <div className="text-2xl font-bold font-mono text-[#0F172A]">
                ₹2,04,140.00
              </div>
              <p className="text-[11px] text-[#5B6B84]">
                Total declined transactions ingested via Razorpay webhooks
              </p>
            </div>

            <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-mono uppercase text-[#5B6B84] font-semibold block">
                Recoverable Volume (EV)
              </span>
              <div className="text-2xl font-bold font-mono text-[#1E5EFF]">
                ₹1,48,220.00
              </div>
              <p className="text-[11px] text-[#5B6B84]">
                Transactions passing merchant policy ceilings &amp; ML thresholds
              </p>
            </div>

            <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-mono uppercase text-[#008760] font-semibold block">
                Gross Recovered Revenue
              </span>
              <div className="text-2xl font-bold font-mono text-[#008760]">
                ₹1,26,450.00
              </div>
              <p className="text-[11px] text-[#5B6B84]">
                Successfully authorized on secondary rails (UPI &amp; retries)
              </p>
            </div>

            <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 space-y-2 shadow-xs">
              <span className="text-[11px] font-mono uppercase text-[#0F172A] font-semibold block">
                Effective Recovery Rate
              </span>
              <div className="text-2xl font-bold font-mono text-[#0F172A]">
                85.3%
              </div>
              <p className="text-[11px] text-[#5B6B84]">
                Recovered revenue divided by policy-approved recoverable volume
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
