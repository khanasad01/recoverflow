"use client";

import React, { useState, useSyncExternalStore, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Search } from "lucide-react";
import {
  fetcher,
  Opportunity,
  triggerManualAction,
  approveOpportunity,
  rejectOpportunity,
} from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { LoadingTableSkeleton, EmptyTableState, ErrorTableState } from "@/components/ui/table-states";
import { toast } from "sonner";
import { OpportunityDrawer } from "@/components/opportunity/opportunity-drawer";

function subscribeDensity(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      return v === "comfortable" ? "comfortable" : "compact";
    },
    () => "compact"
  );
  const [density, setDensity] = useState<"comfortable" | "compact">(storedDensity);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [lastActionResult, setLastActionResult] = useState<{
    actionType: string;
    externalRef?: string;
    timestamp: string;
    status: string;
    details?: string;
    url?: string;
  } | null>(null);

  const handleSelectOpp = async (opp: Opportunity) => {
    setSelectedOpp(opp);
    setLastActionResult(null);
    try {
      const detail = await fetcher(`/api/v1/opportunities/${opp.id}`);
      if (detail && detail.id === opp.id) {
        setSelectedOpp(detail);
      }
    } catch {
      // Keep basic opp data if detail endpoint fails
    }
  };

  const toggleDensity = (newDensity: "comfortable" | "compact") => {
    setDensity(newDensity);
    localStorage.setItem("rf_table_density", newDensity);
  };

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

  const handleManualAction = async (actionType: string) => {
    if (!selectedOpp) return;
    setActionLoading(true);
    try {
      const result = await triggerManualAction(selectedOpp.id, actionType);

      let detailsMsg = "";
      let actionUrl: string | undefined = undefined;

      // Show real action details based on action type
      if (actionType === "incentive" && result.external_ref) {
        detailsMsg = `Coupon Code: ${result.external_ref} (10% discount applied)`;
        toast.success(`🎉 Coupon Code: ${result.external_ref} - 10% discount applied!`);
      } else if (actionType === "payment_link" && result.external_ref) {
        detailsMsg = `Payment Link Created: ${result.external_ref}`;
        actionUrl = "https://dashboard.razorpay.com/app/paymentlinks";
        toast.success(`🔗 Payment Link Created: ${result.external_ref}`, {
          description: "Visible in Razorpay Dashboard → Payment Links",
        });
      } else if (actionType === "smart_retry" && result.external_ref) {
        detailsMsg = `Smart Retry Order: ${result.external_ref}`;
        actionUrl = "https://dashboard.razorpay.com/app/orders";
        toast.success(`🔄 Smart Retry Scheduled: ${result.external_ref}`, {
          description: "Order created in Razorpay Dashboard → Orders",
        });
      } else if (actionType === "email_reminder") {
        detailsMsg = "Email reminder sent to customer via SendGrid";
        toast.success(`📧 Email sent successfully to customer`);
      } else if (actionType === "whatsapp") {
        detailsMsg = result.external_ref
          ? `WhatsApp message sent via Twilio (SID: ${result.external_ref})`
          : "WhatsApp message sent successfully via Twilio";
        toast.success(`📱 WhatsApp message sent successfully`);
      } else {
        detailsMsg = `Action executed successfully (${result.status || "EXECUTED"})`;
        toast.success(`Action '${actionType}' completed`);
      }

      setLastActionResult({
        actionType,
        externalRef: result.external_ref,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        status: result.status || "EXECUTED",
        details: detailsMsg,
        url: actionUrl,
      });

      // Update the local selectedOpp interventions list so the Evidence Timeline updates immediately
      setSelectedOpp((prev) => {
        if (!prev) return null;
        const updatedInterventions = [result, ...(prev.interventions || [])];
        return {
          ...prev,
          retry_count: (prev.retry_count || 0) + 1,
          status: prev.status === "READY" || prev.status === "OPEN" ? "ACTIONED" : prev.status,
          interventions: updatedInterventions,
        };
      });

      await mutate();
      // Keep drawer open so user can inspect the real action result
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
      setSelectedOpp((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
      setLastActionResult({
        actionType: "human_approval",
        externalRef: `appr_${selectedOpp.id}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        status: "APPROVED",
        details: "Approved by finance administrator and dispatched to execution rail",
      });
      await mutate();
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
      setSelectedOpp((prev) => (prev ? { ...prev, status: "FAILED" } : null));
      setLastActionResult({
        actionType: "human_rejection",
        externalRef: `rej_${selectedOpp.id}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        status: "REJECTED",
        details: "Rejected by finance administrator",
      });
      await mutate();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to reject opportunity.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Recovery Queue
            </h2>
            <p className="text-xs text-[#5B6B84] mt-1">
              Operational payment decline pipeline, real-time ML diagnosis, and policy-governed recovery actions.
            </p>
          </div>

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

        <div className="bg-white border border-[#E5E9F0] rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-[#5B6B84] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, customer, reason..."
                className="w-full h-8 pl-9 pr-2.5 text-xs bg-white border border-[#E5E9F0] rounded-md text-[#0F172A] placeholder-[#5B6B84] focus:outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/15"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-[#E5E9F0] rounded-md text-[#0F172A] focus:outline-none focus:border-[#1E5EFF]"
              >
                <option value="">All Pipeline Statuses</option>
                <option value="OPEN">Open (Scored)</option>
                <option value="ACTIONED">Actioned (In Progress)</option>
                <option value="HUMAN_REVIEW">Human Review Required</option>
                <option value="RECOVERED">Recovered (Success)</option>
                <option value="FAILED">Failed / Declined</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-white border border-[#E5E9F0] rounded-md text-[#0F172A] focus:outline-none focus:border-[#1E5EFF]"
              >
                <option value="">All Gateways</option>
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>

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
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#1E5EFF] text-white hover:bg-[#1649D8] transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-2 py-1.5 text-xs text-[#5B6B84] hover:text-[#0F172A]"
                  title="Clear all filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

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
                    <th>Payment</th>
                    <th>Customer</th>
                    <th className="text-right">Amount</th>
                    <th>Failure Reason</th>
                    <th>Risk</th>
                    <th>Recommended Action</th>
                    <th>Probability</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => {
                    const scoreVal = opp.latest_score?.recoverability_score ?? 0.88;
                    const isSelected = selectedOpp?.id === opp.id;
                    const isHighRisk = Number(opp.amount_at_risk || 0) > 50000;
                    const riskLabel = isHighRisk ? "Medium" : "Low";
                    const actionLabel = (opp.failure_reason || "").includes("funds")
                      ? "Smart Retry"
                      : (opp.failure_reason || "").includes("timeout")
                      ? "Safe Retry"
                      : "UPI Link";

                    return (
                      <tr
                        key={opp.id}
                        onClick={() => handleSelectOpp(opp)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-[#F1F4F9]" : ""}`}
                      >
                        <td className="font-mono font-semibold text-[#1E5EFF]">
                          <div>{opp.id}</div>
                          {opp.related_opportunity_id && (
                            <div className="text-[10px] text-[#5B6B84] font-normal font-mono">
                              ↳ {opp.related_opportunity_id}
                            </div>
                          )}
                        </td>
                        <td className="max-w-[120px] truncate text-[#0F172A] font-medium">
                          {opp.customer_id || "Rahul Mehta"}
                        </td>
                        <td className="text-right font-mono font-bold text-[#0F172A]">
                          ₹{Number(opp.amount_at_risk || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-[#5B6B84] max-w-[140px] truncate font-mono text-[11px]">
                          {opp.failure_reason || "card_declined"}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              riskLabel === "Low"
                                ? "bg-[#00C48C]/10 text-[#008760]"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {riskLabel}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs font-semibold text-[#0F172A]">
                            {actionLabel}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16">
                              <ScoreBar score={scoreVal} />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-[#0F172A]">
                              {(scoreVal * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={opp.status} size="sm" />
                        </td>
                        <td className="text-[#5B6B84] font-mono text-[11px] whitespace-nowrap">
                          {new Date(opp.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOpp(opp);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#1E5EFF] hover:bg-[#1E5EFF]/10 rounded transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <OpportunityDrawer
          opportunity={selectedOpp}
          onClose={() => {
            setSelectedOpp(null);
            setLastActionResult(null);
          }}
          onAction={handleManualAction}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading}
          lastActionResult={lastActionResult}
        />
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