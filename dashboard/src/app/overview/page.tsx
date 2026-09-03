"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  HeartPulse,
  Flame,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetcher, OverviewData, Opportunity } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingTableSkeleton, EmptyTableState, ErrorTableState } from "@/components/ui/table-states";

const STATUS_COLORS: Record<string, string> = {
  RECOVERED: "#00C48C",
  ACTIONED: "#F59E0B",
  OPEN: "#1E5EFF",
  HUMAN_REVIEW: "#7B61FF",
  FAILED: "#EF4444",
};

export default function OverviewPage() {
  const router = useRouter();
  const [isolatedStatus, setIsolatedStatus] = useState<string | null>(null);

  const { data, error: overviewError, isLoading: loadingOverview, mutate: mutateOverview } = useSWR<OverviewData>(
    "/api/v1/overview",
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: opportunities, mutate: mutateOpps } = useSWR<Opportunity[]>(
    "/api/v1/opportunities",
    fetcher,
    { refreshInterval: 5000 }
  );

  const refreshAll = () => {
    mutateOverview();
    mutateOpps();
  };

  // Compute Revenue Health segments
  const oppsList = opportunities || [];
  const healthyOpps = oppsList.filter(
    (o) => o.status === "RECOVERED" || (o.latest_score?.recoverability_score ?? 0) >= 0.8
  );
  const healthyAmt = healthyOpps.reduce((sum, o) => sum + Number(o.amount_at_risk || 0), 0);

  const atRiskOpps = oppsList.filter(
    (o) => ["OPEN", "ACTIONED", "HUMAN_REVIEW"].includes(o.status)
  );
  const atRiskAmt = atRiskOpps.reduce((sum, o) => sum + Number(o.amount_at_risk || 0), 0);

  const criticalOpps = oppsList.filter(
    (o) => Number(o.amount_at_risk || 0) > 10000 && (o.latest_score?.recoverability_score ?? 0.5) < 0.4
  );
  const criticalAmt = criticalOpps.reduce((sum, o) => sum + Number(o.amount_at_risk || 0), 0);

  // Donut data with isolation filter
  const rawDonutData = [
    { name: "Recovered", key: "RECOVERED", value: data?.recovered_count ?? 0, color: STATUS_COLORS.RECOVERED },
    { name: "Actioned", key: "ACTIONED", value: data?.actioned_count ?? 0, color: STATUS_COLORS.ACTIONED },
    { name: "Open", key: "OPEN", value: data?.open_count ?? 0, color: STATUS_COLORS.OPEN },
    {
      name: "Failed",
      key: "FAILED",
      value: Math.max(
        0,
        (data?.total_opportunities ?? 0) -
          ((data?.recovered_count ?? 0) + (data?.actioned_count ?? 0) + (data?.open_count ?? 0))
      ),
      color: STATUS_COLORS.FAILED,
    },
  ].filter((d) => d.value > 0);

  const filteredDonutData = isolatedStatus
    ? rawDonutData.filter((d) => d.key === isolatedStatus)
    : rawDonutData;

  const isConnected = !overviewError && !loadingOverview && Boolean(data);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Live Indicator fallback */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Overview
              </h2>
              {/* Real Live Indicator vs. Last Updated fallback */}
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00C48C]/10 border border-[#00C48C]/30 text-[11px] font-mono font-semibold text-[#008760]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                  <span>Live Stream</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-mono text-[#5B6B84]">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Last updated just now</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#5B6B84] mt-1">
              Payment recovery pipeline status and metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1E5EFF]" />
              <span>Refresh</span>
            </button>

            <Link
              href="/opportunities"
              className="btn-pill-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>View All Opportunities</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Global Error Banner if API fails */}
        {overviewError && (
          <ErrorTableState
            title="Overview Telemetry Offline"
            description="Unable to synchronize live metrics with the Recovery Gateway."
            onRetry={refreshAll}
          />
        )}

        {/* ROW 1: 4 Equal-Width Razorpay KPI Cards (Gap 16px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Gross Revenue at Risk"
            value={`₹${data?.revenue_at_risk.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "0.00"}`}
            subtitle={`${data?.total_opportunities ?? 0} failure opportunities`}
            icon={AlertCircle}
          />
          <KpiCard
            title="Expected Value"
            value={`₹${data?.expected_recovery.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "0.00"}`}
            subtitle="ML heuristic scoring model"
            icon={Layers}
          />
          <KpiCard
            title="Gross Recovered"
            value={`₹${data?.gross_recovered.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "0.00"}`}
            subtitle="Autonomous execution"
            icon={CheckCircle2}
            delta={`${data?.recovery_rate_percent ?? 0}% Rate`}
            isPositive={true}
          />
          <KpiCard
            title="Incremental Lift"
            value={`₹${data?.incremental_recovery.toLocaleString("en-IN", { minimumFractionDigits: 2 }) ?? "0.00"}`}
            subtitle="vs Control Group Baseline"
            icon={TrendingUp}
            delta="A/B Verified"
            isPositive={true}
          />
        </div>

        {/* ROW 2: Revenue Health (3 Cards with 3px Colored Left Borders) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#5B6B84]">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-[#0F172A]">
              <Activity className="w-3.5 h-3.5 text-[#1E5EFF]" />
              Real-Time Revenue Health Segments
            </span>
            <span className="font-mono text-[11px]">
              Evaluated across {oppsList.length} events (Click segment to filter)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Healthy Card */}
            <div
              onClick={() => router.push("/opportunities?status=RECOVERED")}
              className="bg-white border border-[#E5E9F0] border-l-4 border-l-[#00C48C] rounded-xl p-5 shadow-[0_20px_40px_rgba(10,37,64,0.06)] hover:shadow-[0_24px_48px_rgba(10,37,64,0.10)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#008760] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                  Healthy / Recovered
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#00C48C]/10 text-[#008760]">
                  {healthyOpps.length} Events
                </span>
              </div>
              <div className="text-2xl font-bold text-[#0F172A] font-mono">
                ₹{healthyAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-[#5B6B84] mt-1">
                Recovered transactions or candidates with &gt;80% recovery score.
              </p>
              <div className="w-full h-1 bg-[#E5E9F0] rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-[#00C48C] rounded-full transition-all"
                  style={{ width: `${oppsList.length > 0 ? (healthyOpps.length / oppsList.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* 2. In Active Recovery Card */}
            <div
              onClick={() => router.push("/opportunities?status=OPEN")}
              className="bg-white border border-[#E5E9F0] border-l-4 border-l-[#F59E0B] rounded-xl p-5 shadow-[0_20px_40px_rgba(10,37,64,0.06)] hover:shadow-[0_24px_48px_rgba(10,37,64,0.10)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#B45309] uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-[#F59E0B]" />
                  In Active Recovery
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F59E0B]/10 text-[#B45309]">
                  {atRiskOpps.length} Events
                </span>
              </div>
              <div className="text-2xl font-bold text-[#0F172A] font-mono">
                ₹{atRiskAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-[#5B6B84] mt-1">
                Open candidates actively being diagnosed and actioned by AI agents.
              </p>
              <div className="w-full h-1 bg-[#E5E9F0] rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B] rounded-full transition-all"
                  style={{ width: `${oppsList.length > 0 ? (atRiskOpps.length / oppsList.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* 3. Critical Exposure Card */}
            <div
              onClick={() => router.push("/opportunities?status=FAILED")}
              className="bg-white border border-[#E5E9F0] border-l-4 border-l-[#EF4444] rounded-xl p-5 shadow-[0_20px_40px_rgba(10,37,64,0.06)] hover:shadow-[0_24px_48px_rgba(10,37,64,0.10)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#EF4444]" />
                  Critical Exposure
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#EF4444]/10 text-[#DC2626]">
                  {criticalOpps.length} Events
                </span>
              </div>
              <div className="text-2xl font-bold text-[#0F172A] font-mono">
                ₹{criticalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-[#5B6B84] mt-1">
                High-value transactions (&gt;₹10k) with score &lt;40% requiring review.
              </p>
              <div className="w-full h-1 bg-[#E5E9F0] rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-[#EF4444] rounded-full transition-all"
                  style={{ width: `${oppsList.length > 0 ? (criticalOpps.length / oppsList.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Recharts Charts (30-day Area Chart + Donut with Right Legend) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 30-Day Area Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E5E9F0] rounded-xl p-6 shadow-[0_20px_40px_rgba(10,37,64,0.06)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A] tracking-wide">
                  Revenue Recovery Trajectory
                </h3>
                <p className="text-xs text-[#5B6B84] mt-0.5">
                  Gross Recovered vs. Incremental Lift (INR)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
                  <span className="text-[#5B6B84] font-medium">Recovered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E5EFF]" />
                  <span className="text-[#5B6B84] font-medium">Incremental Lift</span>
                </div>
              </div>
            </div>

            <div className="h-64">
              {loadingOverview ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-full space-y-3">
                    <div className="h-4 bg-[#E5E9F0] rounded-md w-1/3 animate-pulse" />
                    <div className="h-44 bg-[#F8F9FC] rounded-lg animate-pulse" />
                  </div>
                </div>
              ) : data?.time_series && data.time_series.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.time_series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientRecovered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C48C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00C48C" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                    <XAxis dataKey="timestamp" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E5E9F0",
                        borderRadius: "0.5rem",
                        boxShadow: "0 20px 40px rgba(10,37,64,0.08)",
                        fontSize: "0.75rem",
                        color: "#0F172A",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="recovered_amount"
                      name="Recovered"
                      stroke="#00C48C"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradientRecovered)"
                    />
                    <Area
                      type="monotone"
                      dataKey="incremental_recovery"
                      name="Incremental Lift"
                      stroke="#1E5EFF"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#5B6B84] text-xs">
                  Not enough recovery time-series data yet.
                </div>
              )}
            </div>
          </div>

          {/* Donut Distribution with Right Legend (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E5E9F0] rounded-xl p-6 shadow-[0_20px_40px_rgba(10,37,64,0.06)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Pipeline Distribution</h3>
                  <p className="text-xs text-[#5B6B84] mt-0.5">Click legend to isolate segment</p>
                </div>
                {isolatedStatus && (
                  <button
                    onClick={() => setIsolatedStatus(null)}
                    className="text-[11px] text-[#1E5EFF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Donut and Legend Layout */}
              <div className="flex flex-col sm:flex-row items-center gap-4 my-3">
                <div className="w-36 h-36 relative flex items-center justify-center flex-shrink-0">
                  {loadingOverview ? (
                    <div className="w-32 h-32 rounded-full border-4 border-[#E5E9F0] animate-pulse" />
                  ) : filteredDonutData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={64}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {filteredDonutData.map((item, idx) => (
                            <Cell key={`donut-${idx}`} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E9F0",
                            borderRadius: "0.5rem",
                            fontSize: "0.75rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-[11px] text-[#5B6B84]">No data</span>
                  )}
                </div>

                {/* Legend positioned to the RIGHT of Donut */}
                <div className="flex-1 w-full space-y-2 text-xs">
                  {rawDonutData.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setIsolatedStatus(isolatedStatus === item.key ? null : item.key)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isolatedStatus === item.key ? "bg-[#F1F4F9] font-bold" : "hover:bg-[#F8F9FC]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[#0F172A]">{item.name}</span>
                      </div>
                      <span className="font-mono text-[#5B6B84]">{item.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E9F0] text-xs flex items-center justify-between text-[#5B6B84]">
              <span>Total Tracked</span>
              <strong className="font-mono text-[#0F172A]">{data?.total_opportunities ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* ROW 4: Recent Autonomous Interventions Feed (Last 5) */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl p-6 shadow-[0_20px_40px_rgba(10,37,64,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Recent Autonomous Interventions</h3>
              <p className="text-xs text-[#5B6B84] mt-0.5">Last 5 recovery actions taken</p>
            </div>
            <Link
              href="/interventions"
              className="text-xs font-semibold text-[#1E5EFF] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5E9F0]">
            {loadingOverview ? (
              <LoadingTableSkeleton rows={4} cols={4} />
            ) : data?.recent_interventions && data.recent_interventions.length > 0 ? (
              data.recent_interventions.slice(0, 5).map((intv) => (
                <div key={intv.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F0FF] text-[#1E5EFF] flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0F172A] flex items-center gap-2">
                        <span>{intv.action_type.replace(/_/g, " ").toUpperCase()}</span>
                        <span className="font-mono text-[11px] text-[#5B6B84] font-normal">
                          ({intv.opportunity_id})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5B6B84] truncate max-w-md mt-0.5">
                        {intv.decision_reason || "Autonomous decision executed by LangGraph"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                    {intv.confidence && (
                      <span className="text-[11px] text-[#5B6B84] font-mono hidden sm:inline">
                        {(intv.confidence * 100).toFixed(0)}% conf
                      </span>
                    )}
                    <StatusBadge status={intv.status} size="sm" />
                    <span className="text-[#5B6B84] font-mono text-[11px]">
                      {new Date(intv.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyTableState
                title="No recent interventions"
                description="When the engine acts on payment decline webhooks, live interventions will appear here."
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
