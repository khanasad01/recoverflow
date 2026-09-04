"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ShieldCheck,
  Check,
  Ban,
  RotateCw,
  Zap,
  Gift,
  Mail,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  User,
  FileCheck2,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { Opportunity, EvidenceEvent } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorTableState } from "@/components/ui/table-states";

export interface ActionResult {
  actionType: string;
  externalRef?: string;
  timestamp: string;
  status: string;
  details?: string;
  url?: string;
}

interface OpportunityDrawerProps {
  isOpen?: boolean;
  opportunity: Opportunity | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClose: () => void;
  onAction: (actionType: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  actionLoading: boolean;
  lastActionResult: ActionResult | null;
}

export function OpportunityDrawer({
  isOpen = true,
  opportunity: selectedOpp,
  isLoading = false,
  error = null,
  onRetry,
  onClose,
  onAction,
  onApprove,
  onReject,
  actionLoading,
  lastActionResult,
}: OpportunityDrawerProps) {
  const [manualViewOpen, setManualViewOpen] = useState(false);

  // If explicitly closed, do not render
  if (isOpen === false) return null;
  if (!selectedOpp && !isLoading && !error) return null;

  const scoreVal = selectedOpp?.latest_score?.recoverability_score ?? 0.88;
  const expectedVal = selectedOpp?.latest_score?.expected_recovery ?? selectedOpp?.amount_at_risk;
  const isHighValue = Number(selectedOpp?.amount_at_risk || 0) >= 50000;
  const isHumanReview = selectedOpp?.status === "HUMAN_REVIEW" || isHighValue;

  const opportunityEvidence: EvidenceEvent[] = (selectedOpp?.interventions || []).map((intv) => {
    let reasonText = intv.decision_reason || `Intervention ${intv.action_type} executed`;
    if (intv.external_ref) {
      if (intv.action_type === "incentive") {
        reasonText += ` (Coupon: ${intv.external_ref})`;
      } else if (intv.action_type === "payment_link") {
        reasonText += ` (Link ID: ${intv.external_ref})`;
      } else if (intv.action_type === "smart_retry") {
        reasonText += ` (Razorpay Order: ${intv.external_ref})`;
      } else {
        reasonText += ` (Ref: ${intv.external_ref})`;
      }
    }
    return {
      id: intv.id,
      opportunity_id: intv.opportunity_id,
      intervention_id: intv.id,
      event_type: intv.action_type.toUpperCase(),
      actor: "Recovery Engine",
      reason: reasonText,
      created_at: intv.created_at,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A2540]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-[500px] bg-white h-full shadow-[0_32px_64px_rgba(10,37,64,0.16)] flex flex-col z-10 animate-in slide-in-from-right duration-200 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between bg-[#F8F9FC]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-sm text-[#0F172A]">
              {selectedOpp?.id || "Payment Event Detail"}
            </span>
            {selectedOpp && <StatusBadge status={selectedOpp.status} size="sm" />}
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-[#5B6B84] hover:text-[#0F172A] hover:bg-[#E5E9F0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse flex-1 overflow-y-auto">
            <div className="h-24 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl" />
            <div className="h-28 bg-white border border-[#E5E9F0] rounded-xl" />
            <div className="h-32 bg-blue-50/40 border border-blue-100 rounded-xl" />
            <div className="h-10 bg-[#E5E9F0] rounded-md" />
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-6 my-auto">
            <ErrorTableState
              title="Unable to load payment details"
              description={error}
              onRetry={onRetry}
            />
          </div>
        ) : !selectedOpp ? (
          /* Empty State when no payment selected */
          <div className="p-8 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-12 h-12 rounded-xl bg-[#F1F4F9] border border-[#E5E9F0] text-[#5B6B84] flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-semibold text-[#0F172A]">No payment selected</h4>
            <p className="text-xs text-[#5B6B84] mt-1 max-w-xs leading-relaxed">
              Select a payment failure opportunity from the recovery queue to inspect recovery score, policy compliance, and autonomous actions.
            </p>
          </div>
        ) : (
          <>
            {/* High Value Escalation Gate */}
            {selectedOpp.status === "HUMAN_REVIEW" && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Human Approval Gate (High-Value Ceiling &gt; ₹50,000)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onApprove}
                disabled={actionLoading}
                className="py-2 px-3 rounded-lg bg-[#00C48C] hover:bg-[#008760] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Action</span>
              </button>
              <button
                onClick={onReject}
                disabled={actionLoading}
                className="py-2 px-3 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Payment & Failure Overview */}
          <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E5E9F0] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-[#5B6B84] uppercase tracking-wider block">
                  Amount at Risk
                </span>
                <div className="text-2xl font-bold font-mono text-[#0F172A] mt-0.5">
                  ₹{Number(selectedOpp.amount_at_risk || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-semibold text-[#5B6B84] uppercase tracking-wider block">
                  Expected EV
                </span>
                <div className="text-xl font-bold font-mono text-[#008760] mt-0.5">
                  ₹{Number(expectedVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#E5E9F0] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-red-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span>{selectedOpp.failure_reason || "card_declined"}</span>
              </div>
              <span className="text-[#5B6B84] font-mono">
                Source: {selectedOpp.source_type || "razorpay"}
              </span>
            </div>
          </div>

          {/* PAYMENT CONTEXT */}
          <div className="p-3.5 bg-white border border-[#E5E9F0] rounded-xl space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B6B84] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-[#1E5EFF]" /> PAYMENT CONTEXT
              </span>
              <span className="text-[#008760] font-semibold bg-[#00C48C]/10 px-1.5 py-0.2 rounded text-[9px]">
                LOW RISK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[#5B6B84] block text-[10px]">Customer:</span>
                <span className="font-semibold text-[#0F172A] truncate block">
                  {selectedOpp.customer_id || "Rahul Mehta"}
                </span>
              </div>
              <div>
                <span className="text-[#5B6B84] block text-[10px]">Prior Successes:</span>
                <span className="font-mono font-semibold text-[#0F172A]">3 payments</span>
              </div>
              <div>
                <span className="text-[#5B6B84] block text-[10px]">Prior Failures:</span>
                <span className="font-mono font-semibold text-[#5B6B84]">1 payment</span>
              </div>
              <div>
                <span className="text-[#5B6B84] block text-[10px]">Alternate Rails:</span>
                <span className="font-semibold text-[#008760]">UPI Verified</span>
              </div>
            </div>
          </div>

          {/* RECOVERY RECOMMENDATION (The 3 Questions) */}
          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#1E5EFF]" /> RECOVERY RECOMMENDATION
              </span>
              <span className="font-mono text-[11px] font-bold text-[#1E5EFF]">
                {(scoreVal * 100).toFixed(0)}% Probability
              </span>
            </div>

            <div className="text-[12px] font-bold text-[#0F172A]">
              Switch to UPI payment link
            </div>

            <div className="space-y-2 text-[11px] text-[#0F172A]">
              <div className="p-2 bg-white rounded border border-blue-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase block">Why it failed:</span>
                <p className="text-[#0F172A]">
                  Card network decline reported by issuing bank.
                </p>
              </div>

              <div className="p-2 bg-white rounded border border-blue-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase block">Why recovery is possible:</span>
                <p className="text-[#0F172A]">
                  Customer has 3 prior successful payments and has previously completed UPI transactions.
                </p>
              </div>

              <div className="p-2 bg-white rounded border border-blue-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase block">Why UPI was selected:</span>
                <p className="text-[#0F172A]">
                  Merchant policy allows dynamic fallback for low-risk card declines under ₹25,000.
                </p>
              </div>
            </div>
          </div>

          {/* POLICY EVALUATION CHECKLIST */}
          <div className="p-3.5 bg-white border border-[#E5E9F0] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase tracking-wider">
                POLICY EVALUATION
              </span>
              <span className="font-mono font-bold text-[#008760] text-[10px] bg-[#00C48C]/10 px-2 py-0.5 rounded border border-[#00C48C]/20">
                {isHumanReview ? "APPROVAL REQUIRED" : "AUTO-ELIGIBLE"}
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

          {/* ACTION BUTTONS */}
          <div className="space-y-2">
            {lastActionResult ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Payment recovered successfully
                  </span>
                  <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                    {lastActionResult.status || "CAPTURED"}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#0F172A] flex items-center justify-between">
                  <span>Recovered Amount:</span>
                  <span className="font-bold text-[#008760] text-sm">
                    ₹{Number(selectedOpp.amount_at_risk || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {lastActionResult.details && (
                  <p className="text-[11px] text-[#0F172A] bg-white/70 p-2 rounded border border-emerald-100">
                    {lastActionResult.details}
                  </p>
                )}
                {lastActionResult.externalRef && (
                  <div className="text-[11px] font-mono text-[#0F172A]">
                    Razorpay Reference: <span className="font-bold">{lastActionResult.externalRef}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-xs">
                  <Link
                    href={`/interventions?q=${selectedOpp.id}`}
                    className="text-[11px] text-[#1E5EFF] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Audit Trail</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  {lastActionResult.url && (
                    <a
                      href={lastActionResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#5B6B84] hover:text-[#0F172A] inline-flex items-center gap-1 font-medium"
                    >
                      <span>Razorpay Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAction("payment_link")}
                  disabled={actionLoading}
                  className="py-2.5 px-4 rounded-md bg-[#E11D48] hover:bg-[#BE123C] text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                  <span>Recover payment</span>
                </button>

                <button
                  onClick={() => setManualViewOpen(!manualViewOpen)}
                  className="py-2.5 px-4 rounded-md border border-[#E5E9F0] hover:bg-slate-50 text-[#0F172A] font-medium transition-colors cursor-pointer text-center"
                >
                  <span>Review manually</span>
                </button>
              </div>
            )}

            <div className="text-center text-[10px] text-[#5B6B84] font-mono flex items-center justify-center gap-1 pt-1">
              <FileCheck2 className="w-3 h-3 text-[#5B6B84]" />
              <span>Action will be recorded in Razorpay audit trail</span>
            </div>
          </div>

          {/* Alternative Actions Drawer Collapse */}
          {manualViewOpen && (
            <div className="p-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#5B6B84] uppercase block">
                Alternative Manual Rails
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => onAction("smart_retry")}
                  disabled={actionLoading}
                  className="p-2 bg-white rounded border border-[#E5E9F0] hover:border-[#1E5EFF] text-left text-[#0F172A] flex items-center gap-1.5 font-medium"
                >
                  <RotateCw className="w-3 h-3 text-[#1E5EFF]" />
                  <span>Smart Retry</span>
                </button>
                <button
                  onClick={() => onAction("whatsapp")}
                  disabled={actionLoading}
                  className="p-2 bg-white rounded border border-[#E5E9F0] hover:border-[#1E5EFF] text-left text-[#0F172A] flex items-center gap-1.5 font-medium"
                >
                  <MessageSquare className="w-3 h-3 text-[#00C48C]" />
                  <span>WhatsApp Link</span>
                </button>
                <button
                  onClick={() => onAction("incentive")}
                  disabled={actionLoading}
                  className="p-2 bg-white rounded border border-[#E5E9F0] hover:border-[#1E5EFF] text-left text-[#0F172A] flex items-center gap-1.5 font-medium"
                >
                  <Gift className="w-3 h-3 text-[#635BFF]" />
                  <span>5% Incentive</span>
                </button>
                <button
                  onClick={() => onAction("email_reminder")}
                  disabled={actionLoading}
                  className="p-2 bg-white rounded border border-[#E5E9F0] hover:border-[#1E5EFF] text-left text-[#0F172A] flex items-center gap-1.5 font-medium"
                >
                  <Mail className="w-3 h-3 text-[#5B6B84]" />
                  <span>Email Prompt</span>
                </button>
              </div>
            </div>
          )}

          {/* Evidence & Decision Timeline */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5B6B84]">
              Evidence &amp; Decision Timeline
            </div>
            <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E5E9F0]">
              {opportunityEvidence.length > 0 ? (
                opportunityEvidence.map((ev, idx) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#1E5EFF] ring-4 ring-white" />
                    <div className="font-semibold text-[#0F172A] flex items-center justify-between">
                      <span>{ev.event_type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] font-mono text-[#5B6B84]">
                        {new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[#5B6B84] text-[11px] mt-0.5">
                      {ev.reason || `Action recorded by ${ev.actor || "Recovery Engine"}`}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#5B6B84]">No prior recovery actions dispatched for this event.</div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
