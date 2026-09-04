"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Save,
  RotateCcw,
  AlertCircle,
  Plus,
  X,
  Check,
  FileCode2,
} from "lucide-react";
import { fetcher, PolicyData, updatePolicyYaml } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import {
  LoadingCardSkeleton,
  LoadingFormSkeleton,
  EmptyTableState,
  ErrorTableState,
} from "@/components/ui/table-states";
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

interface VisualRule {
  id: string;
  name: string;
  tag: string;
  status: "Active" | "Enforced" | "Disabled";
  ifDesc: string;
  thenDesc: string;
  automation: string;
  maxAttempts: string;
  cooldown: string;
}

const INITIAL_VISUAL_RULES: VisualRule[] = [
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

export default function PolicyPage() {
  const [activeTab, setActiveTab] = useState<"visual" | "yaml">("visual");
  const [editedYaml, setEditedYaml] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [rules, setRules] = useState<VisualRule[]>(INITIAL_VISUAL_RULES);

  // Create / Edit modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formIfDesc, setFormIfDesc] = useState<string>("");
  const [formThenDesc, setFormThenDesc] = useState<string>("");
  const [formMaxAttempts, setFormMaxAttempts] = useState<string>("3");
  const [formCooldown, setFormCooldown] = useState<string>("30 min");

  const { data: policyData, error, isLoading, mutate } = useSWR<PolicyData>("/api/v1/policy", fetcher);

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
    setRules(INITIAL_VISUAL_RULES);
    setValidationError(null);
    toast.info("Recovery rules reset to default blueprint.");
  };

  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setFormName("");
    setFormIfDesc("Reason in ['card_declined'] · Risk = Low");
    setFormThenDesc("Dispatch dynamic Razorpay UPI link via WhatsApp");
    setFormMaxAttempts("2");
    setFormCooldown("15 min");
    setShowModal(true);
  };

  const handleOpenEditModal = (rule: VisualRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormIfDesc(rule.ifDesc);
    setFormThenDesc(rule.thenDesc);
    setFormMaxAttempts(rule.maxAttempts);
    setFormCooldown(rule.cooldown);
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    if (editingRuleId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRuleId
            ? {
                ...r,
                name: formName,
                ifDesc: formIfDesc,
                thenDesc: formThenDesc,
                maxAttempts: formMaxAttempts,
                cooldown: formCooldown,
              }
            : r
        )
      );
      toast.success(`Rule "${formName}" updated successfully!`);
    } else {
      const newRule: VisualRule = {
        id: `rule_${Date.now()}`,
        name: formName.toUpperCase(),
        tag: `Rule #${String(rules.length + 1).padStart(2, "0")} · Custom Policy`,
        status: "Active",
        ifDesc: formIfDesc,
        thenDesc: formThenDesc,
        automation: "Automatic",
        maxAttempts: formMaxAttempts,
        cooldown: formCooldown,
      };
      setRules((prev) => [newRule, ...prev]);
      toast.success(`New recovery rule "${formName}" created!`);
    }
    setShowModal(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              status: r.status === "Disabled" ? "Active" : "Disabled",
            }
          : r
      )
    );
    toast.success("Rule status updated.");
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    toast.success("Rule removed from policy definition.");
  };

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

        {/* Error State Banner */}
        {error && (
          <ErrorTableState
            title="Unable to load recovery policies"
            description="Failed to synchronize recovery rule guardrails from the engine. Please try again."
            onRetry={() => {
              mutate();
              toast.info("Retrying policy synchronization...");
            }}
          />
        )}

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
            onClick={handleOpenCreateModal}
            className="btn-pill-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Rule</span>
          </button>
        </div>

        {/* TAB 1: VISUAL RULES */}
        {activeTab === "visual" && (
          <div>
            {isLoading ? (
              <LoadingCardSkeleton count={4} className="grid grid-cols-1 md:grid-cols-2 gap-4" />
            ) : rules.length === 0 ? (
              <EmptyTableState
                title="No recovery rules defined yet"
                description="No recovery rules defined yet. Create your first rule to automate recovery."
                actionLabel="Create your first recovery rule"
                onAction={handleOpenCreateModal}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((rule) => (
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
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          rule.status === "Active"
                            ? "bg-[#00C48C]/10 text-[#008760] border-[#00C48C]/20"
                            : rule.status === "Enforced"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
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
                        onClick={() => handleOpenEditModal(rule)}
                        className="font-semibold text-[#1E5EFF] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const dup: VisualRule = {
                            ...rule,
                            id: `rule_${Date.now()}`,
                            name: `${rule.name} (COPY)`,
                            tag: `Rule #${String(rules.length + 1).padStart(2, "0")} · Copy`,
                          };
                          setRules([dup, ...rules]);
                          toast.success(`Duplicated rule "${rule.name}"`);
                        }}
                        className="text-[#5B6B84] hover:text-[#0F172A] cursor-pointer"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="text-slate-500 hover:text-red-600 cursor-pointer"
                      >
                        {rule.status === "Disabled" ? "Enable" : "Disable"}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: YAML EDITOR */}
        {activeTab === "yaml" && (
          <div>
            {isLoading ? (
              <LoadingFormSkeleton rows={8} />
            ) : (
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
        )}

        {/* CREATE / EDIT RULE MODAL */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-modal-title"
          >
            <div
              className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowModal(false)}
              aria-hidden="true"
            />

            <div className="relative bg-white rounded-2xl border border-[#E5E9F0] shadow-2xl max-w-md w-full p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F0FF] text-[#1E5EFF] flex items-center justify-center">
                    <FileCode2 className="w-4 h-4" />
                  </div>
                  <h3 id="rule-modal-title" className="text-sm font-bold text-[#0F172A]">
                    {editingRuleId ? "Edit Recovery Rule" : "Create Recovery Rule"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close dialog"
                  className="p-1 rounded-lg text-[#5B6B84] hover:text-[#0F172A] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="font-semibold text-[#0F172A]">Rule Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CARD DECLINE AUTO FALLBACK"
                    required
                    className="w-full h-9 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#1E5EFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#0F172A]">IF (Decline Conditions)</label>
                  <input
                    type="text"
                    value={formIfDesc}
                    onChange={(e) => setFormIfDesc(e.target.value)}
                    placeholder="e.g. Amount < ₹25,000 · Reason in ['card_declined']"
                    required
                    className="w-full h-9 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#1E5EFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#0F172A]">THEN (Target Action)</label>
                  <input
                    type="text"
                    value={formThenDesc}
                    onChange={(e) => setFormThenDesc(e.target.value)}
                    placeholder="e.g. Generate Razorpay UPI Link & send via WhatsApp"
                    required
                    className="w-full h-9 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#1E5EFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#0F172A]">Max Retries</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formMaxAttempts}
                      onChange={(e) => setFormMaxAttempts(e.target.value)}
                      className="w-full h-9 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#1E5EFF]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#0F172A]">Cooldown</label>
                    <input
                      type="text"
                      value={formCooldown}
                      onChange={(e) => setFormCooldown(e.target.value)}
                      placeholder="e.g. 15 min"
                      className="w-full h-9 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#1E5EFF]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-pill-secondary px-4 py-2 text-xs font-semibold cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-pill-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingRuleId ? "Save Changes" : "Create Rule"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
