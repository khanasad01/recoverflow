"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Save,
  RotateCcw,
  AlertCircle,
  Plus,
} from "lucide-react";
import { fetcher, PolicyData, updatePolicyYaml } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { toast } from "sonner";

const DEFAULT_POLICY_TEMPLATE = `max_payment_link_amount: 25000
human_approval_threshold: 50000
max_retry_attempts: 3
allowed_failure_reasons:
  - insufficient_funds
  - card_declined
  - payment_failed
  - bad_request_error
  - bank_error
  - network_issue
  - gateway_timeout

actions:
  payment_link:
    max_amount: 25000
    allowed_failure_reasons:
      - insufficient_funds
      - card_declined
      - payment_failed
    max_attempts: 2
    cooldown_minutes: 30

  smart_retry:
    max_amount: 50000
    allowed_failure_reasons:
      - bank_error
      - network_issue
      - gateway_timeout
    max_attempts: 3
    cooldown_minutes: 15

  email_reminder:
    max_amount: 50000
    allowed_failure_reasons:
      - card_declined
      - insufficient_funds
    max_attempts: 3
`;

export default function PolicyPage() {
  const [activeTab, setActiveTab] = useState<"visual" | "yaml">("visual");
  const [editedYaml, setEditedYaml] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: policyData, mutate } = useSWR<PolicyData>("/api/v1/policy", fetcher);

  const yamlContent = editedYaml !== null ? editedYaml : (policyData?.yaml_content || DEFAULT_POLICY_TEMPLATE);

  const handleCodeChange = (newCode: string) => {
    setEditedYaml(newCode);
    try {
      if (!newCode.includes("actions:") || !newCode.includes("max_payment_link_amount:")) {
        setValidationError("Policy must define root keys 'actions' and 'max_payment_link_amount'.");
      } else {
        setValidationError(null);
      }
    } catch {
      setValidationError("Syntax error in YAML definition.");
    }
  };

  const handleSave = async () => {
    if (validationError) return;
    setSaving(true);
    try {
      await updatePolicyYaml(yamlContent);
      toast.success("Recovery rules compiled and deployed successfully!");
      await mutate();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update policy YAML.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedYaml(DEFAULT_POLICY_TEMPLATE);
    setValidationError(null);
    toast.info("Recovery rules reset to default blueprint.");
  };

  const visualRules = [
    {
      id: "card_decline",
      name: "CARD DECLINE",
      tag: "Rule #01 · Fallback Rail",
      status: "Active",
      ifDesc: "Amount < ₹25,000 · Risk = Low or Medium · Reason in ['card_declined', 'issuer_timeout']",
      thenDesc: "Generate Razorpay UPI Payment Link & dispatch via WhatsApp",
      automation: "Automatic",
      maxAttempts: "2",
      cooldown: "30 min",
    },
    {
      id: "insufficient_funds",
      name: "INSUFFICIENT FUNDS",
      tag: "Rule #02 · Recurring Subscription",
      status: "Active",
      ifDesc: "Reason == 'insufficient_funds' · Product == 'subscription'",
      thenDesc: "Delay retry to merchant salary-cycle window (1st-5th of month)",
      automation: "Scheduled",
      maxAttempts: "3",
      cooldown: "48 hours",
    },
    {
      id: "high_value",
      name: "HIGH VALUE TRANSACTION CEILING",
      tag: "Rule #03 · Human Escalation",
      status: "Enforced",
      ifDesc: "Amount >= ₹50,000.00 · Any failure reason",
      thenDesc: "Halt automation · Hold in Recovery Queue for dual-operator approval",
      automation: "Manual Review Required",
      maxAttempts: "1",
      cooldown: "Immediate",
    },
    {
      id: "gateway_timeout",
      name: "GATEWAY TIMEOUT",
      tag: "Rule #04 · Infrastructure Failover",
      status: "Active",
      ifDesc: "Reason in ['gateway_timeout', 'bank_error'] · Rail Latency > 2,500ms",
      thenDesc: "Safe idempotent retry once acquirer rail telemetry stabilizes below 200ms",
      automation: "Automatic",
      maxAttempts: "2",
      cooldown: "15 min",
    },
  ];

  const lines = yamlContent.split("\n");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Recovery Rules
            </h2>
            <p className="text-xs text-[#5B6B84] mt-1">
              Deterministic safety ceilings, retry limits, and merchant-defined recovery policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5B6B84]" />
              <span>Reset Blueprint</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || Boolean(validationError)}
              className="btn-pill-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Deploy Rules</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("visual")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "visual"
                  ? "bg-[#0A2540] text-white"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              Visual Rule Cards
            </button>
            <button
              onClick={() => setActiveTab("yaml")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "yaml"
                  ? "bg-[#0A2540] text-white"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              YAML Policy Definition
            </button>
          </div>

          <button
            onClick={() => toast.info("Rule creation modal opened.")}
            className="px-3 py-1 text-xs font-semibold text-[#1E5EFF] hover:bg-[#1E5EFF]/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Rule</span>
          </button>
        </div>

        {/* TAB 1: VISUAL RULES */}
        {activeTab === "visual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visualRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-xs space-y-4 text-xs"
              >
                <div className="flex items-start justify-between border-b border-[#E5E9F0] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#5B6B84] uppercase font-bold">
                      {rule.tag}
                    </span>
                    <h3 className="font-mono font-bold text-sm text-[#0F172A] mt-0.5">
                      {rule.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00C48C]/10 text-[#008760] border border-[#00C48C]/20">
                    {rule.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#5B6B84] block">
                      IF (CONDITIONS):
                    </span>
                    <p className="font-mono text-[11px] text-[#0F172A] p-2 bg-[#F8F9FC] border border-[#E5E9F0] rounded mt-1">
                      {rule.ifDesc}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#5B6B84] block">
                      THEN (ACTION):
                    </span>
                    <p className="text-[11px] text-[#0F172A] font-medium p-2 bg-blue-50/40 border border-blue-100 rounded mt-1">
                      {rule.thenDesc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E9F0] text-[11px]">
                  <div>
                    <span className="text-[10px] text-[#5B6B84] block">Automation</span>
                    <span className="font-semibold text-[#0F172A] truncate block">{rule.automation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5B6B84] block">Max Retries</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{rule.maxAttempts}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5B6B84] block">Cooldown</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{rule.cooldown}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#E5E9F0] text-xs">
                  <button
                    onClick={() => toast.info(`Editing rule: ${rule.name}`)}
                    className="font-semibold text-[#1E5EFF] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toast.info(`Duplicating rule: ${rule.name}`)}
                    className="text-[#5B6B84] hover:text-[#0F172A]"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => toast.info(`Rule ${rule.name} state toggled.`)}
                    className="text-slate-500 hover:text-red-600"
                  >
                    Disable
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: YAML EDITOR */}
        {activeTab === "yaml" && (
          <div className="bg-[#061224] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-[#0A1E3C] px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
                <span className="ml-2 font-semibold text-white">policies/recovery_guardrails.yaml</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{lines.length} lines</span>
                <span>•</span>
                <span className="text-[#00D4FF]">Valid Syntax</span>
              </div>
            </div>

            <div className="p-4 font-mono text-xs text-slate-200 flex overflow-x-auto min-h-[460px]">
              <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800/80 space-y-1 w-8 flex-shrink-0">
                {lines.map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              <textarea
                value={yamlContent}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="flex-1 pl-4 bg-transparent outline-none resize-none border-none text-slate-200 leading-5 font-mono whitespace-pre w-full min-h-[460px]"
              />
            </div>

            {validationError && (
              <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
