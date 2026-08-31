"use client";

import React, { useState, useSyncExternalStore, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  Search,
  X,
  ShieldCheck,
  RotateCw,
  Gift,
  Check,
  Ban,
  Mail,
  Zap,
} from "lucide-react";
import {
  fetcher,
  Opportunity,
  triggerManualAction,
  approveOpportunity,
  rejectOpportunity,
  EvidenceEvent,
} from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { WhyCard } from "@/components/opportunity/why-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { LoadingTableSkeleton, EmptyTableState, ErrorTableState } from "@/components/ui/table-states";
import { toast } from "sonner";

function subscribeDensity(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters read from URL
  const initialStatus = searchParams.get("status") || "";
  const initialSource = searchParams.get("source") || "";
  const initialSearch = searchParams.get("q") || "";
  const initialMinScore = Number(searchParams.get("minScore") || 0);

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sourceFilter, setSourceFilter] = useState<string>(initialSource);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [minScore, setMinScore] = useState<number>(initialMinScore);

  const storedDensity = useSyncExternalStore<"comfortable" | "compact">(
    subscribeDensity,
    () => {
      const v = localStorage.getItem("rf_table_density");
      return v === "compact" ? "compact" : "comfortable";
    },
    () => "comfortable"
  );
  const [density, setDensity] = useState<"comfortable" | "compact">(storedDensity);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const toggleDensity = (newDensity: "comfortable" | "compact") => {
    setDensity(newDensity);
    localStorage.setItem("rf_table_density", newDensity);
  };

  // Synchronize URL query params
  const updateUrlParams = (newStatus: string, newSource: string, newSearch: string, newScore: number) => {
    const params = new URLSearchParams();
    if (newStatus) params.set("status", newStatus);
    if (newSource) params.set("source", newSource);
    if (newSearch) params.set("q", newSearch);
    if (newScore > 0) params.set("minScore", String(newScore));
    router.replace(`/opportunities?${params.toString()}`);
  };

  const handleApplyFilters = () => {
    updateUrlParams(statusFilter, sourceFilter, searchQuery, minScore);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setSourceFilter("");
    setSearchQuery("");
    setMinScore(0);
    router.replace("/opportunities");
  };

  const { data: opportunities, error, isLoading, mutate } = useSWR<Opportunity[]>(
    "/api/v1/opportunities",
    fetcher,
    { refreshInterval: 5000 }
  );

  // Filter pipeline
  const filteredOpportunities = (opportunities || []).filter((opp) => {
    if (statusFilter && opp.status !== statusFilter) return false;
    if (sourceFilter && opp.source_type?.toLowerCase() !== sourceFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = opp.id.toLowerCase().includes(q);
      const matchCust = (opp.customer_id || "").toLowerCase().includes(q);
      const matchReason = (opp.failure_reason || "").toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchReason) return false;
    }
    const scoreVal = (opp.latest_score?.recoverability_score ?? 0.5) * 100;
    if (scoreVal < minScore) return false;
    return true;
  });

  // Action Triggers
  const handleManualAction = async (actionType: string) => {
    if (!selectedOpp) return;
    setActionLoading(true);
    try {
      await triggerManualAction(selectedOpp.id, actionType);
      toast.success(`Action '${actionType}' triggered for ${selectedOpp.id}`);
      await mutate();
      setSelectedOpp(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to trigger recovery action.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOpp) return;
    setActionLoading(true);
    try {
      await approveOpportunity(selectedOpp.id);
      toast.success(`Opportunity ${selectedOpp.id} approved!`);
      await mutate();
      setSelectedOpp(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to approve opportunity.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOpp) return;
    setActionLoading(true);
    try {
      await rejectOpportunity(selectedOpp.id);
      toast.success(`Opportunity ${selectedOpp.id} rejected.`);
      await mutate();
      setSelectedOpp(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to reject opportunity.");
    } finally {
      setActionLoading(false);
    }
  };

  // Convert opportunity interventions into synthetic evidence events for timeline
  const opportunityEvidence: EvidenceEvent[] = (selectedOpp?.interventions || []).map((intv) => ({
    id: intv.id,
    opportunity_id: intv.opportunity_id,
    intervention_id: intv.id,
    event_type: intv.action_type.toUpperCase(),
    actor: "LangGraph Agent",
    reason: intv.decision_reason || `Intervention ${intv.action_type} executed`,
    created_at: intv.created_at,
  }));

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Failure Recovery Opportunities
            </h2>
            <p className="text-xs text-[#5B6B84] mt-1">
              Real-time payment decline pipeline, ML recoverability scores, and deterministic guardrail actions.
            </p>
          </div>

          {/* Density Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E5E9F0] rounded-lg shadow-xs self-start sm:self-auto text-xs">
            <button
              onClick={() => toggleDensity("comfortable")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                density === "comfortable" ? "bg-[#1E5EFF] text-white font-semibold" : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              Comfortable
            </button>
            <button
              onClick={() => toggleDensity("compact")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                density === "compact" ? "bg-[#1E5EFF] text-white font-semibold" : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              Compact
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (4 cols) */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-[#5B6B84] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, customer, reason..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-[#E5E9F0] rounded-lg text-[#0F172A] placeholder-[#5B6B84] focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/15"
              />
            </div>

            {/* Status Select (3 cols) */}
            <div className="lg:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1E5EFF]"
              >
                <option value="">All Pipeline Statuses</option>
                <option value="OPEN">Open (Scored)</option>
                <option value="ACTIONED">Actioned (In Progress)</option>
                <option value="HUMAN_REVIEW">Human Review Required</option>
                <option value="RECOVERED">Recovered (Success)</option>
                <option value="FAILED">Failed / Declined</option>
              </select>
            </div>

            {/* Gateway Source (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#1E5EFF]"
              >
                <option value="">All Gateways</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>

            {/* Score Slider (3 cols) */}
            <div className="lg:col-span-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] text-[#5B6B84] mb-1">
                  <span>Min Score</span>
                  <span className="font-mono font-semibold text-[#0F172A]">{minScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="10"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5E9F0] rounded-lg accent-[#1E5EFF] cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 pt-3 sm:pt-0">
                <button
                  onClick={handleApplyFilters}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#1E5EFF] text-white hover:bg-[#1649D8] transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-2 py-2 text-xs text-[#5B6B84] hover:text-[#0F172A]"
                  title="Clear all filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities Table Container */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <ErrorTableState
              title="Failed to load opportunities"
              description="Unable to fetch active failure events from the ingestion gateway."
              onRetry={() => mutate()}
            />
          ) : isLoading ? (
            <LoadingTableSkeleton rows={8} cols={8} />
          ) : filteredOpportunities.length === 0 ? (
            <EmptyTableState
              title="No opportunities found"
              description="No payment decline candidates matching your selected filter criteria."
              actionLabel="Clear Filters"
              onAction={handleClearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full table-fintech text-left ${density === "compact" ? "compact" : ""}`}>
                <thead>
                  <tr>
                    <th>Opportunity ID</th>
                    <th>Source</th>
                    <th>Customer</th>
                    <th className="text-right">Amount at Risk</th>
                    <th>Failure Reason</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Group</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => {
                    const scoreVal = opp.latest_score?.recoverability_score ?? 0.5;
                    const isSelected = selectedOpp?.id === opp.id;

                    return (
                      <tr
                        key={opp.id}
                        onClick={() => setSelectedOpp(opp)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-[#F1F4F9]" : ""}`}
                      >
                        {/* ID */}
                        <td className="font-mono font-semibold text-[#1E5EFF]">
                          <div>{opp.id}</div>
                          {opp.related_opportunity_id && (
                            <div className="text-[10px] text-[#5B6B84] font-normal font-mono">
                              ↳ Linked: {opp.related_opportunity_id}
                            </div>
                          )}
                        </td>

                        {/* Source */}
                        <td>
                          <span className="capitalize font-medium text-[#0F172A]">
                            {opp.source_type || "razorpay"}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="max-w-xs truncate text-[#0F172A]">
                          {opp.customer_id || "cust_guest_checkout"}
                        </td>

                        {/* Amount at Risk */}
                        <td className="text-right font-mono font-semibold text-[#0F172A]">
                          ₹{Number(opp.amount_at_risk || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Failure Reason */}
                        <td className="text-[#5B6B84] max-w-xs truncate font-mono text-[11px]">
                          {opp.failure_reason || "card_declined"}
                        </td>

                        {/* Score */}
                        <td className="w-32">
                          <ScoreBar score={scoreVal} />
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge status={opp.status} size="sm" />
                        </td>

                        {/* A/B Group */}
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              opp.group === "treatment"
                                ? "bg-[#1E5EFF]/10 text-[#1E5EFF]"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {opp.group || "treatment"}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="text-[#5B6B84] font-mono text-[11px] whitespace-nowrap">
                          {new Date(opp.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT DETAIL DRAWER (480px, --shadow-modal) */}
        {selectedOpp && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Scrim */}
            <div
              className="fixed inset-0 bg-[#0A2540]/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedOpp(null)}
            />

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-[480px] bg-white h-full shadow-[0_32px_64px_rgba(10,37,64,0.16)] flex flex-col z-10 animate-in slide-in-from-right duration-200">
              {/* Drawer Topbar */}
              <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between bg-[#F8F9FC]">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-[#0F172A]">{selectedOpp.id}</span>
                  <StatusBadge status={selectedOpp.status} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOpp(null)}
                    aria-label="Close drawer"
                    className="p-1.5 rounded-lg text-[#5B6B84] hover:text-[#0F172A] hover:bg-[#E5E9F0] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* HUMAN REVIEW BANNER (Top of drawer, impossible to miss) */}
              {selectedOpp.status === "HUMAN_REVIEW" && (
                <div className="p-4 bg-[#7B61FF]/10 border-b border-[#7B61FF]/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5B41E6]">
                    <ShieldCheck className="w-4 h-4 text-[#7B61FF]" />
                    <span>Human Authorization Required (High Value &gt; ₹50,000)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="py-2.5 px-4 rounded-full bg-[#00C48C] hover:bg-[#008760] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Action</span>
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="py-2.5 px-4 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Drawer Scrollable Content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Financial Metadata Card */}
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

                {/* Structured Why Card (Label/Value Grid) */}
                <WhyCard opportunity={selectedOpp} evidenceList={opportunityEvidence} />

                {/* Contextual Action Buttons (only valid actions render) */}
                {selectedOpp.status !== "HUMAN_REVIEW" && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#5B6B84]">
                      Available Recovery Actions
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleManualAction("smart_retry")}
                        disabled={actionLoading}
                        className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#1E5EFF]" />
                        <span>Smart Retry</span>
                      </button>

                      <button
                        onClick={() => handleManualAction("payment_link")}
                        disabled={actionLoading}
                        className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#1E5EFF]" />
                        <span>Send Payment Link</span>
                      </button>

                      <button
                        onClick={() => handleManualAction("incentive")}
                        disabled={actionLoading}
                        className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Gift className="w-3.5 h-3.5 text-[#635BFF]" />
                        <span>Apply Incentive</span>
                      </button>

                      <button
                        onClick={() => handleManualAction("email_reminder")}
                        disabled={actionLoading}
                        className="p-2.5 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#5B6B84]" />
                        <span>Email Sequence</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Evidence Timeline (Vertical Dot-and-Line) */}
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
        )}
      </div>
    </AppLayout>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#5B6B84]">Loading opportunities...</div>}>
      <OpportunitiesContent />
    </Suspense>
  );
}
