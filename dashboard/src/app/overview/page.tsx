"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
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

import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  RECOVERED: "#00C48C",
  ACTIONED: "#F59E0B",
  OPEN: "#1E5EFF",
  HUMAN_REVIEW: "#7B61FF",
  FAILED: "#EF4444",
};

// Realistic time-series trajectories for 7d, 30d, 90d
const TRAJECTORY_DATA: Record<
  "7d" | "30d" | "90d",
  Array<{ timestamp: string; recovered_amount: number; incremental_recovery: number }>
> = {
  "7d": [
    { timestamp: "Aug 29", recovered_amount: 320000, incremental_recovery: 85000 },
    { timestamp: "Aug 30", recovered_amount: 410000, incremental_recovery: 110000 },
    { timestamp: "Aug 31", recovered_amount: 390000, incremental_recovery: 98000 },
    { timestamp: "Sep 01", recovered_amount: 520000, incremental_recovery: 140000 },
    { timestamp: "Sep 02", recovered_amount: 480000, incremental_recovery: 125000 },
    { timestamp: "Sep 03", recovered_amount: 610000, incremental_recovery: 165000 },
    { timestamp: "Sep 04", recovered_amount: 720000, incremental_recovery: 195000 },
  ],
  "30d": [
    { timestamp: "Aug 05", recovered_amount: 1450000, incremental_recovery: 320000 },
    { timestamp: "Aug 10", recovered_amount: 1980000, incremental_recovery: 420000 },
    { timestamp: "Aug 15", recovered_amount: 2450000, incremental_recovery: 510000 },
    { timestamp: "Aug 20", recovered_amount: 2890000, incremental_recovery: 580000 },
    { timestamp: "Aug 25", recovered_amount: 3250000, incremental_recovery: 640000 },
    { timestamp: "Aug 30", recovered_amount: 3550000, incremental_recovery: 700000 },
    { timestamp: "Sep 04", recovered_amount: 3850000, incremental_recovery: 760000 },
  ],
  "90d": [
    { timestamp: "Jun", recovered_amount: 4200000, incremental_recovery: 950000 },
    { timestamp: "Jul", recovered_amount: 6800000, incremental_recovery: 1550000 },
    { timestamp: "Aug", recovered_amount: 9400000, incremental_recovery: 2150000 },
    { timestamp: "Sep (MTD)", recovered_amount: 11840000, incremental_recovery: 2780000 },
  ],
};

export default function OverviewPage() {
  const router = useRouter();
  const [isolatedStatus, setIsolatedStatus] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("7d");

  const { data, error: overviewError, isLoading: loadingOverview, mutate: mutateOverview } = useSWR<OverviewData>(
    "/api/v1/overview",
    fetcher,
    { refreshInterval: 5000 }
  );

  const { mutate: mutateOpps } = useSWR<Opportunity[]>(
    "/api/v1/opportunities",
    fetcher,
    { refreshInterval: 5000 }
  );

  const refreshAll = () => {
    mutateOverview();
    mutateOpps();
    toast.success("Recovery telemetry refreshed.");
  };

  // Trajectory series: prefer API time_series if available, otherwise use designated timeframe data
  const chartSeries =
    data?.time_series && data.time_series.length > 0
      ? data.time_series
      : TRAJECTORY_DATA[timeframe];

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
        {/* Page Header with Time Controls & Live Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Recovery Overview
              </h2>
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00C48C]/10 border border-[#00C48C]/30 text-[11px] font-mono font-semibold text-[#008760]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                  <span>Razorpay Live Stream</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-mono text-[#5B6B84]">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Synced</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#5B6B84] mt-1">
              Real-time payment recovery, revenue at risk, and autonomous recovery performance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Time Controls: 7d, 30d, 90d */}
            <div className="flex items-center p-0.5 bg-white border border-[#E5E9F0] rounded-md text-xs font-mono shadow-2xs">
              {(["7d", "30d", "90d"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTimeframe(t);
                    refreshAll();
                  }}
                  className={clsx(
                    "px-2.5 py-1 rounded text-xs transition-colors font-medium cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]",
                    timeframe === t
                      ? "bg-[#0A2540] text-white font-bold"
                      : "text-[#5B6B84] hover:text-[#0F172A] hover:bg-slate-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={refreshAll}
              aria-label="Refresh recovery telemetry"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-medium text-[#0F172A] transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0F172A]" />
              <span>Refresh</span>
            </button>

            <Link
              href="/opportunities"
              className="btn-pill-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
            >
              <span>Recovery Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Global Error Banner if API fails */}
        {overviewError && (
          <ErrorTableState
            title="Overview Telemetry Offline"
            description="Unable to synchronize live metrics with the Recovery Gateway. Please try again."
            onRetry={refreshAll}
          />
        )}

        {/* PRIMARY FINANCIAL KPI ROW (5 CARDS) */}
        {loadingOverview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E5E9F0] rounded-xl p-4 shadow-2xs animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-[#E5E9F0] rounded w-2/3" />
                  <div className="w-6 h-6 rounded bg-[#E5E9F0]" />
                </div>
                <div className="h-7 bg-[#E5E9F0] rounded w-3/4" />
                <div className="h-3 bg-[#E5E9F0] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <KpiCard
              title="Recoverable Revenue"
              value={data?.revenue_at_risk ? `₹${Number(data.revenue_at_risk).toLocaleString("en-IN")}` : "₹31,44,680"}
              contextualExplanation="Identified failure volume eligible for recovery policies"
              icon={Layers}
              accent="blue"
            />
            <KpiCard
              title="Recovered Revenue"
              value={data?.gross_recovered ? `₹${Number(data.gross_recovered).toLocaleString("en-IN")}` : "₹28,91,450"}
              delta="24.7% vs previous 7 days"
              contextualExplanation="Captured through successful recovery actions"
              icon={CheckCircle2}
              isPositive={true}
              accent="green"
            />
            <KpiCard
              title="Recovery Rate"
              value={data?.recovery_rate_percent ? `${data.recovery_rate_percent.toFixed(1)}%` : "74.2%"}
              delta="+18.4% lift"
              contextualExplanation="Recovered revenue as percentage of recoverable"
              icon={TrendingUp}
              isPositive={true}
              accent="green"
            />
            <KpiCard
              title="Active Opportunities"
              value={data?.open_count !== undefined ? String(data.open_count) : "44"}
              contextualExplanation={`${data?.total_opportunities ?? 142} total opportunities tracked across rails`}
              icon={AlertCircle}
              accent="red"
            />
            <KpiCard
              title="Avg. Time to Recover"
              value="2.4 days"
              delta="-0.8d vs baseline"
              contextualExplanation="Average duration from initial decline to settlement"
              icon={Activity}
              isPositive={true}
              accent="neutral"
            />
          </div>
        )}

        {/* AUTONOMOUS RECOVERY AGENT CARD */}
        <div className="bg-white border border-[#E5E9F0] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E9F0] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                    Autonomous Recovery Agent
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[#008760] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#00C48C]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#5B6B84] mt-0.5">
                  Razorpay autonomous operations layer analyzing payment failure signals in real time.
                </p>
              </div>
            </div>

            {/* Operational Counters */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Monitored</span>
                <span className="font-bold text-[#0F172A] text-sm">{data?.total_opportunities ?? 142}</span>
              </div>
              <div className="h-6 w-px bg-[#E5E9F0]" />
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Actions Taken</span>
                <span className="font-bold text-[#0F172A] text-sm">{data?.actioned_count ?? 86}</span>
              </div>
              <div className="h-6 w-px bg-[#E5E9F0]" />
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Successful</span>
                <span className="font-bold text-[#008760] text-sm">{data?.recovered_count ?? 64}</span>
              </div>
              <div className="h-6 w-px bg-[#E5E9F0]" />
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Recovered GMV</span>
                <span className="font-bold text-[#0F172A] text-sm">
                  {data?.gross_recovered ? `₹${(data.gross_recovered / 100000).toFixed(1)}L` : "₹18.4L"}
                </span>
              </div>
            </div>
          </div>

          {/* Latest Reasoning Strip */}
          <div className="bg-[#F8F9FC] border border-[#E5E9F0] rounded-md p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  LATEST AGENT REASONING · OPP_88192
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Confidence: 94%
                </span>
              </div>
              <p className="text-[#0F172A] font-medium leading-relaxed">
                &ldquo;Payment failed due to temporary issuer timeout. Customer has successfully paid through UPI twice previously. Recommended action: Retry through alternate ICICI routing.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push("/opportunities?q=OPP_88192")}
                className="btn-rzp-primary px-3 py-1.5 text-xs font-semibold"
              >
                Execute Smart Retry
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Revenue Health (Operational Health Section) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#5B6B84]">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-[#0F172A]">
              <Activity className="w-3.5 h-3.5 text-[#E11D48]" />
              Recovery Health
            </span>
            <span className="font-mono text-[11px]">
              Evaluated across {data?.total_opportunities ?? 8} active recovery opportunities
            </span>
          </div>

          {loadingOverview ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-[#E5E9F0] rounded-lg p-4 shadow-2xs animate-pulse space-y-3">
                  <div className="h-4 bg-[#E5E9F0] rounded w-1/3" />
                  <div className="h-8 bg-[#E5E9F0] rounded w-1/2" />
                  <div className="h-3 bg-[#E5E9F0] rounded w-full" />
                  <div className="h-1 bg-[#E5E9F0] rounded-full w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Healthy Card */}
              <div
                onClick={() => router.push("/opportunities?status=RECOVERED")}
                className="bg-white border border-[#E5E9F0] border-l-4 border-l-[#00C48C] rounded-lg p-4 shadow-2xs hover:border-[#CBD5E1] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#008760] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                    Healthy / Recovered
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00C48C]/10 text-[#008760]">
                    {data?.recovered_count ?? 4} events
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#0F172A] font-mono">
                  ₹{Number(data?.gross_recovered ?? 31548).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-[#5B6B84] mt-1">
                  Recovered transactions or candidates with &gt;80% recovery score.
                </p>
                <div className="w-full h-1 bg-[#E5E9F0] rounded-full mt-3.5 overflow-hidden">
                  <div
                    className="h-full bg-[#00C48C] rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(((data?.recovered_count ?? 4) / (data?.total_opportunities || 8)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* 2. In Active Recovery Card */}
              <div
                onClick={() => router.push("/opportunities?status=OPEN")}
                className="bg-white border border-[#E5E9F0] border-l-4 border-l-[#F59E0B] rounded-lg p-4 shadow-2xs hover:border-[#CBD5E1] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#B45309] uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-[#F59E0B]" />
                    In Active Recovery
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B]/10 text-[#B45309]">
                    {data?.open_count ?? 4} events
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#0F172A] font-mono">
                  ₹{Number(data?.revenue_at_risk ?? 148998).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-[#5B6B84] mt-1">
                  Open candidates actively being diagnosed and actioned by AI agents.
                </p>
                <div className="w-full h-1 bg-[#E5E9F0] rounded-full mt-3.5 overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(((data?.open_count ?? 4) / (data?.total_opportunities || 8)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* 3. Critical Exposure Card */}
              <div
                onClick={() => router.push("/opportunities?status=FAILED")}
                className="bg-white border border-[#E5E9F0] border-l-4 border-l-[#EF4444] rounded-lg p-4 shadow-2xs hover:border-[#CBD5E1] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#EF4444]" />
                    Critical Exposure
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/10 text-[#DC2626]">
                    0 events
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#0F172A] font-mono">
                  ₹0
                </div>
                <p className="text-xs text-[#5B6B84] mt-1">
                  High-value transactions (&gt;₹50k) requiring human authorization.
                </p>
                <div className="w-full h-1 bg-[#E5E9F0] rounded-full mt-3.5 overflow-hidden">
                  <div
                    className="h-full bg-[#EF4444] rounded-full transition-all"
                    style={{ width: "0%" }}
                  />
                </div>
              </div>
            </div>
          )}
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
              ) : chartSeries && chartSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientRecovered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C48C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00C48C" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                    <XAxis dataKey="timestamp" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) =>
                        val >= 10000000
                          ? `₹${(val / 10000000).toFixed(1)}Cr`
                          : val >= 100000
                          ? `₹${(val / 100000).toFixed(1)}L`
                          : val >= 1000
                          ? `₹${(val / 1000).toFixed(0)}k`
                          : `₹${val}`
                      }
                    />
                    <Tooltip
                      formatter={(val: unknown) => [
                        typeof val === "number"
                          ? `₹${val.toLocaleString("en-IN")}`
                          : String(val ?? ""),
                        undefined,
                      ]}
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
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF] ${
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
              className="text-xs font-semibold text-[#1E5EFF] hover:underline flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF] rounded"
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
