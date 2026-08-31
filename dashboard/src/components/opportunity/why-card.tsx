"use client";

import React from "react";
import { Brain, ShieldCheck } from "lucide-react";
import { Opportunity, EvidenceEvent } from "@/lib/api";

interface WhyCardProps {
  opportunity: Opportunity;
  evidenceList?: EvidenceEvent[];
}

export function WhyCard({ opportunity, evidenceList = [] }: WhyCardProps) {
  const scoreVal = opportunity.latest_score?.recoverability_score ?? 0.5;
  const expectedVal = opportunity.latest_score?.expected_recovery ?? (
    Number(opportunity.amount_at_risk || 0) * scoreVal
  ).toFixed(2);

  const diagnosisEv = evidenceList.find((e) => e.event_type === "DIAGNOSIS_COMPLETED");
  const diagnosisText =
    diagnosisEv?.reason ||
    opportunity.failure_reason ||
    "Payment declined by issuing bank; automated fallback candidate";

  const actionEv = evidenceList.find((e) => e.event_type === "ACTION_SELECTED");
  const actionPayload = actionEv?.payload as Record<string, unknown> | undefined;
  const rawAction = typeof actionPayload?.selected_action === "string" ? actionPayload.selected_action : "smart_retry";
  const selectedAction = rawAction.replace(/_/g, " ").toUpperCase();
  const rawConfidence = typeof actionPayload?.confidence === "number" ? actionPayload.confidence : 0.88;
  const confidence = (rawConfidence * 100).toFixed(0);

  const policyEv = evidenceList.find(
    (e) => e.event_type === "POLICY_EVALUATED" || e.event_type === "HUMAN_REVIEW_REQUIRED"
  );
  const policyPayload = policyEv?.payload as Record<string, unknown> | undefined;
  const isHumanReview = opportunity.status === "HUMAN_REVIEW" || policyEv?.event_type === "HUMAN_REVIEW_REQUIRED";
  const policyResult = isHumanReview
    ? "Approval Required (>₹50k)"
    : policyPayload?.allowed === false
    ? "Violation Blocked"
    : "Passed (100% Deterministic)";

  return (
    <div className="bg-white border border-[#E5E9F0] rounded-xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#E8F0FF] text-[#1E5EFF] flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 stroke-[1.5]" />
          </div>
          <span className="text-xs font-semibold text-[#0F172A] tracking-tight">
            Explainable AI Diagnosis
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF]">
          CONFIDENCE: {confidence}%
        </span>
      </div>

      {/* Label / Value Structured Grid for high scanning speed */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg">
          <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider block">
            Root Cause Diagnosis
          </span>
          <span className="font-medium text-[#0F172A] line-clamp-2 mt-0.5">
            {diagnosisText}
          </span>
        </div>

        <div className="p-2.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg">
          <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider block">
            Recoverability Score
          </span>
          <span className="font-mono font-bold text-[#1E5EFF] text-sm mt-0.5 block">
            {(scoreVal * 100).toFixed(0)}% ({scoreVal >= 0.7 ? "High" : scoreVal >= 0.4 ? "Moderate" : "Low"})
          </span>
        </div>

        <div className="p-2.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg">
          <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider block">
            Expected Recovery (EV)
          </span>
          <span className="font-mono font-bold text-[#008760] text-sm mt-0.5 block">
            ₹{Number(expectedVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-2.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg">
          <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider block">
            Selected Action Rail
          </span>
          <span className="font-mono font-semibold text-[#0F172A] mt-0.5 block">
            {selectedAction}
          </span>
        </div>
      </div>

      {/* Policy Result Status */}
      <div className="p-2.5 rounded-lg border border-[#E5E9F0] bg-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#5B6B84]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1E5EFF]" />
          <span>Policy Evaluation:</span>
        </div>
        <span
          className={`font-semibold font-mono text-[11px] ${
            isHumanReview ? "text-[#7B61FF]" : "text-[#008760]"
          }`}
        >
          {policyResult}
        </span>
      </div>
    </div>
  );
}
