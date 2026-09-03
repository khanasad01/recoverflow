"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Zap,
  ArrowUpRight,
  Search,
  RotateCw,
  Mail,
  Gift,
  CreditCard,
} from "lucide-react";
import { fetcher, Intervention } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingTableSkeleton, EmptyTableState, ErrorTableState } from "@/components/ui/table-states";

export default function InterventionsPage() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: interventions, error, isLoading, mutate } = useSWR<Intervention[]>(
    "/api/v1/interventions",
    fetcher,
    { refreshInterval: 5000 }
  );

  const filteredInterventions = (interventions || []).filter((intv) => {
    if (actionFilter && intv.action_type.toLowerCase() !== actionFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = intv.id.toLowerCase().includes(q);
      const matchOpp = intv.opportunity_id.toLowerCase().includes(q);
      const matchReason = (intv.decision_reason || "").toLowerCase().includes(q);
      if (!matchId && !matchOpp && !matchReason) return false;
    }
    return true;
  });

  const getActionIcon = (actionType: string) => {
    const act = actionType.toLowerCase();
    if (act.includes("retry")) return <RotateCw className="w-4 h-4 text-[#1E5EFF]" />;
    if (act.includes("email")) return <Mail className="w-4 h-4 text-[#5B6B84]" />;
    if (act.includes("incentive")) return <Gift className="w-4 h-4 text-[#635BFF]" />;
    if (act.includes("card")) return <CreditCard className="w-4 h-4 text-[#00C48C]" />;
    return <Zap className="w-4 h-4 text-[#1E5EFF]" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Recent Autonomous Interventions
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[#008760] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#00C48C]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                Live Dispatch
              </span>
            </div>
            <p className="text-xs text-[#5B6B84] mt-1">
              Audit ledger of automated retries, payment link deliveries, and manual overrides.
            </p>
          </div>
        </div>

        {/* Action Filter Bar */}
        <div className="bg-white border border-[#E5E9F0] rounded-lg p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#5B6B84] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search intervention ID or opportunity ID..."
                className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-[#F8F9FC] border border-[#E5E9F0] rounded-md text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15"
              />
            </div>

            {/* Action Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "", label: "All Actions" },
                { id: "smart_retry", label: "Smart Retry" },
                { id: "payment_link", label: "Payment Link" },
                { id: "incentive", label: "Incentive" },
                { id: "human_review", label: "Human Review" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActionFilter(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    actionFilter === tab.id
                      ? "bg-[#0A2540] text-white"
                      : "bg-[#F8F9FC] text-[#5B6B84] hover:text-[#0F172A] border border-[#E5E9F0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interventions Table */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <ErrorTableState
              title="Unable to load intervention ledger"
              description="Failed to communicate with the action execution log."
              onRetry={() => mutate()}
            />
          ) : isLoading ? (
            <LoadingTableSkeleton rows={6} cols={6} />
          ) : filteredInterventions.length === 0 ? (
            <EmptyTableState
              title="No interventions found"
              description="When the engine acts upon decline events, audited action entries will appear here."
              actionLabel="Clear Filter"
              onAction={() => {
                setActionFilter("");
                setSearchQuery("");
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fintech text-left">
                <thead>
                  <tr>
                    <th>Intervention ID</th>
                    <th>Linked Opportunity</th>
                    <th>Action Type</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Decision Reason &amp; Result</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.map((intv) => (
                    <tr key={intv.id} className="hover:bg-[#F1F4F9] transition-colors">
                      {/* ID */}
                      <td className="font-mono font-semibold text-[#1E5EFF] text-xs">
                        {intv.id}
                      </td>

                      {/* Linked Opportunity */}
                      <td>
                        <Link
                          href={`/opportunities?q=${intv.opportunity_id}`}
                          className="font-mono text-xs text-[#0F172A] hover:text-[#1E5EFF] hover:underline inline-flex items-center gap-1"
                        >
                          <span>{intv.opportunity_id}</span>
                          <ArrowUpRight className="w-3 h-3 text-[#5B6B84]" />
                        </Link>
                      </td>

                      {/* Action Type */}
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#F1F4F9] flex items-center justify-center">
                            {getActionIcon(intv.action_type)}
                          </div>
                          <span className="font-medium text-[#0F172A] text-xs">
                            {intv.action_type.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={intv.status} size="sm" />
                      </td>

                      {/* Confidence */}
                      <td className="font-mono text-xs text-[#5B6B84]">
                        {intv.confidence ? `${(intv.confidence * 100).toFixed(0)}%` : "N/A"}
                      </td>

                      {/* Reason */}
                      <td className="max-w-md text-xs text-[#5B6B84] truncate">
                        {intv.decision_reason || "Autonomous decision executed by LangGraph recovery agent."}
                      </td>

                      {/* Timestamp */}
                      <td className="font-mono text-[11px] text-[#5B6B84] whitespace-nowrap">
                        {new Date(intv.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                        <span className="text-[10px] text-slate-400">
                          ({new Date(intv.created_at).toLocaleDateString()})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
