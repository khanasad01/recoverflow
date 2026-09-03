import React from "react";
import { X, ShieldCheck, Check, Ban, RotateCw, Zap, Gift, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { Opportunity, EvidenceEvent } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { WhyCard } from "@/components/opportunity/why-card";

export interface ActionResult {
  actionType: string;
  externalRef?: string;
  timestamp: string;
  status: string;
  details?: string;
  url?: string;
}

interface OpportunityDrawerProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onAction: (actionType: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  actionLoading: boolean;
  lastActionResult: ActionResult | null;
}

export function OpportunityDrawer({
  opportunity: selectedOpp,
  onClose,
  onAction,
  onApprove,
  onReject,
  actionLoading,
  lastActionResult,
}: OpportunityDrawerProps) {
  if (!selectedOpp) return null;

  const opportunityEvidence: EvidenceEvent[] = (selectedOpp.interventions || []).map((intv) => {
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
      actor: "LangGraph Agent",
      reason: reasonText,
      created_at: intv.created_at,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#0A2540]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[480px] bg-white h-full shadow-[0_32px_64px_rgba(10,37,64,0.16)] flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between bg-[#F8F9FC]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-[#0F172A]">{selectedOpp.id}</span>
            <StatusBadge status={selectedOpp.status} size="sm" />
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-[#5B6B84] hover:text-[#0F172A] hover:bg-[#E5E9F0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedOpp.status === "HUMAN_REVIEW" && (
          <div className="p-4 bg-[#7B61FF]/10 border-b border-[#7B61FF]/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B41E6]">
              <ShieldCheck className="w-4 h-4 text-[#7B61FF]" />
              <span>Human Authorization Required (High Value &gt; ₹50,000)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onApprove}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-full bg-[#00C48C] hover:bg-[#008760] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Action</span>
              </button>
              <button
                onClick={onReject}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E5E9F0] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider block">
                Amount at Risk
              </span>
              <div className="text-2xl font-bold font-mono text-[#0F172A] mt-0.5">
                ₹{Number(selectedOpp.amount_at_risk || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-[#5B6B84] block mt-0.5">
                Customer: {selectedOpp.customer_id || "N/A"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider block">
                Expected EV
              </span>
              <div className="text-xl font-bold font-mono text-[#008760] mt-0.5">
                ₹{Number(selectedOpp.latest_score?.expected_recovery || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Last Action Result Banner */}
          {lastActionResult && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#1E5EFF]/08 via-[#635BFF]/05 to-[#00C48C]/08 border border-[#1E5EFF]/20 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse" />
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Last Action Result
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00C48C]/15 text-[#008760]">
                  {lastActionResult.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6B84]">Action Rail:</span>
                  <span className="font-semibold text-[#0F172A] capitalize">
                    {lastActionResult.actionType.replace(/_/g, " ")}
                  </span>
                </div>

                {lastActionResult.externalRef && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5B6B84] shrink-0">
                      {lastActionResult.actionType === "incentive"
                        ? "Coupon Code:"
                        : lastActionResult.actionType === "payment_link"
                        ? "Payment Link ID:"
                        : lastActionResult.actionType === "smart_retry"
                        ? "Razorpay Order ID:"
                        : "Reference ID:"}
                    </span>
                    <span className="font-mono font-bold text-[#1E5EFF] bg-white px-2 py-0.5 rounded border border-[#E5E9F0] truncate">
                      {lastActionResult.externalRef}
                    </span>
                  </div>
                )}

                {lastActionResult.details && (
                  <div className="text-[11px] text-[#5B6B84] pt-1 border-t border-[#E5E9F0]/60">
                    {lastActionResult.details}
                  </div>
                )}

                {lastActionResult.url && (
                  <div className="pt-1">
                    <a
                      href={lastActionResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E5EFF] hover:underline"
                    >
                      <span>View in Razorpay Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="text-[10px] text-[#94A3B8] text-right font-mono pt-1">
                  Dispatched at {lastActionResult.timestamp}
                </div>
              </div>
            </div>
          )}

          <WhyCard opportunity={selectedOpp} evidenceList={opportunityEvidence} />

          {selectedOpp.status !== "HUMAN_REVIEW" && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5B6B84]">
                Available Recovery Actions
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAction("smart_retry")}
                  disabled={actionLoading}
                  className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#1E5EFF]" />
                  <span>Smart Retry</span>
                </button>

                <button
                  onClick={() => onAction("payment_link")}
                  disabled={actionLoading}
                  className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-[#1E5EFF]" />
                  <span>Send Payment Link</span>
                </button>

                <button
                  onClick={() => onAction("incentive")}
                  disabled={actionLoading}
                  className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Gift className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span>Apply Incentive</span>
                </button>

                <button
                  onClick={() => onAction("email_reminder")}
                  disabled={actionLoading}
                  className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#5B6B84]" />
                  <span>Email Sequence</span>
                </button>

                <button
                  onClick={() => onAction("whatsapp")}
                  disabled={actionLoading}
                  className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#00C48C]" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5B6B84]">
              Evidence &amp; Decision Timeline
            </div>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E5E9F0]">
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
                      {ev.reason || `Action recorded by ${ev.actor || "LangGraph Agent"}`}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#5B6B84]">No prior action records for this opportunity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
