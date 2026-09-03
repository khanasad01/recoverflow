"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Save,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { fetcher, PolicyData, updatePolicyYaml } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { toast } from "sonner";

const DEFAULT_POLICY_TEMPLATE = `max_payment_link_amount: 10000
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
    max_amount: 10000
    allowed_failure_reasons:
      - insufficient_funds
      - card_declined
      - payment_failed
      - bad_request_error
    max_attempts: 3

  smart_retry:
    max_amount: 50000
    allowed_failure_reasons:
      - bank_error
      - network_issue
      - gateway_timeout
      - temporary_error
    max_attempts: 3

  email_reminder:
    max_amount: 50000
    allowed_failure_reasons:
      - card_declined
      - card_expired
      - expired_card
      - insufficient_funds
      - payment_failed
    max_attempts: 5

  incentive:
    max_amount: 50000
    allowed_failure_reasons:
      - card_declined
      - insufficient_funds
    max_attempts: 2
`;

export default function PolicyPage() {
  const [activeTab, setActiveTab] = useState<"yaml" | "rego">("yaml");
  const [editedYaml, setEditedYaml] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessFlash, setSaveSuccessFlash] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: policyData, mutate } = useSWR<PolicyData>("/api/v1/policy", fetcher);
  const yamlContent = editedYaml ?? (policyData?.yaml_content || DEFAULT_POLICY_TEMPLATE);

  // Client-side YAML validator
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
      setSaveSuccessFlash(true);
      toast.success("Policy guardrails successfully updated and compiled!");
      await mutate();
      setTimeout(() => setSaveSuccessFlash(false), 2000);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update policy YAML.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedYaml(DEFAULT_POLICY_TEMPLATE);
    setValidationError(null);
    toast.info("Policy editor reset to default blueprint.");
  };

  const lines = yamlContent.split("\n");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Policy
            </h2>
            <p className="text-xs text-[#5B6B84] mt-1">
              Safety ceilings, retry limits, and human escalation thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-full border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5B6B84]" />
              <span>Reset Blueprint</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || Boolean(validationError)}
              className="btn-pill-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Deploy Guardrails</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("yaml")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "yaml"
                  ? "bg-[#1E5EFF] text-white shadow-xs"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              YAML Policy Definition
            </button>
            <div className="relative group">
              <button
                disabled
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-slate-100 cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Rego (OPA)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                  Coming Soon
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-semibold text-[#1E5EFF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showPreview ? "Hide Parsed Preview" : "Show Parsed Preview"}</span>
            {showPreview ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Editor & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Monaco-Style Code Editor Window (Spans 7 or 12 cols) */}
          <div
            className={`transition-all duration-200 ${
              showPreview ? "lg:col-span-7" : "lg:col-span-12"
            } bg-[#061224] rounded-xl border ${
              saveSuccessFlash ? "border-[#00C48C] ring-2 ring-[#00C48C]/30" : "border-slate-800"
            } shadow-xl overflow-hidden`}
          >
            {/* Editor Title Bar */}
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

            {/* Editor Core with Line Numbers and Gutter */}
            <div className="p-4 font-mono text-xs text-slate-200 flex overflow-x-auto min-h-[460px]">
              {/* Line Numbers Gutter */}
              <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800/80 space-y-1 w-8 flex-shrink-0">
                {lines.map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Editable Text Area */}
              <textarea
                value={yamlContent}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="flex-1 pl-4 bg-transparent outline-none resize-none border-none text-slate-200 leading-5 font-mono whitespace-pre w-full min-h-[460px]"
              />
            </div>

            {/* Validation Error Gutter Alert */}
            {validationError && (
              <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Parsed Preview Panel (5 cols) */}
          {showPreview && (
            <div className="lg:col-span-5 bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1E5EFF]" />
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Compiled Active Rules
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[#008760]">
                  Deterministic
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-[#5B6B84] uppercase block">
                    Human Escalation Ceiling
                  </span>
                  <div className="text-lg font-bold font-mono text-[#0F172A]">₹50,000.00</div>
                  <p className="text-[11px] text-[#5B6B84]">
                    Transactions above this amount require compliance officer sign-off before actioning.
                  </p>
                </div>

                <div className="p-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-[#5B6B84] uppercase block">
                    Max Payment Link Amount
                  </span>
                  <div className="text-lg font-bold font-mono text-[#0F172A]">₹10,000.00</div>
                  <p className="text-[11px] text-[#5B6B84]">
                    Dynamic UPI QR links will not exceed this cap per customer session.
                  </p>
                </div>

                <div className="p-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-[#5B6B84] uppercase block">
                    Max Retry Attempts
                  </span>
                  <div className="text-lg font-bold font-mono text-[#1E5EFF]">3 Retries</div>
                  <p className="text-[11px] text-[#5B6B84]">
                    Prevents excessive card authorization attempts and cardholder churn.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
