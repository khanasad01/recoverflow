"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  BrainCircuit,
  Lock,
  ChevronDown,
  Activity,
  BadgeCheck,
  RotateCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// 30-day realistic financial trajectory data (tabular numbers)
const CHART_DATA = [
  { day: "Aug 01", recovered: 1240000, atRisk: 1680000 },
  { day: "Aug 04", recovered: 1420000, atRisk: 1750000 },
  { day: "Aug 07", recovered: 1680000, atRisk: 1890000 },
  { day: "Aug 10", recovered: 1950000, atRisk: 2120000 },
  { day: "Aug 13", recovered: 2340000, atRisk: 2480000 },
  { day: "Aug 16", recovered: 2890000, atRisk: 2810000 },
  { day: "Aug 19", recovered: 3410000, atRisk: 3150000 },
  { day: "Aug 22", recovered: 3950000, atRisk: 3420000 },
  { day: "Aug 25", recovered: 4230000, atRisk: 3600000 },
  { day: "Aug 27", recovered: 4580000, atRisk: 3750000 },
];

const AGENT_LEADERBOARD = [
  { name: "Smart Retry Agent", icon: RotateCw, count: "824 recovered", rate: 88, color: "#1E5EFF" },
  { name: "Instant UPI Link Agent", icon: Zap, count: "512 recovered", rate: 82, color: "#635BFF" },
  { name: "Salary Cycle Rescheduler", icon: BrainCircuit, count: "340 recovered", rate: 76, color: "#7B61FF" },
  { name: "Policy Gatekeeper", icon: ShieldCheck, count: "1,842 verified", rate: 100, color: "#00C48C" },
];

const RECOVERY_REASONS = [
  { label: "Card network decline – smart retry succeeded", pct: 42, color: "#1E5EFF" },
  { label: "Insufficient funds – rescheduled on salary cycle", pct: 31, color: "#635BFF" },
  { label: "3DS timeout – instant WhatsApp UPI link", pct: 18, color: "#7B61FF" },
  { label: "Gateway error – dynamic ICICI switch", pct: 9, color: "#00B4D8" },
];

const LIVE_EVENTS = [
  { id: "ev1", text: "₹14,850 recovered", agent: "Smart Retry Agent", time: "2 min ago", ref: "OPP_88192" },
  { id: "ev2", text: "₹4,200 recovered", agent: "WhatsApp UPI Agent", time: "5 min ago", ref: "OPP_88191" },
  { id: "ev3", text: "₹82,500 recovered", agent: "Salary Reschedule Agent", time: "11 min ago", ref: "OPP_88189" },
];

export function ExecutiveOverviewSection() {
  const [dateRange, setDateRange] = useState("Last 30 days");

  return (
    <section className="py-20 lg:py-24 bg-[#FFFFFF] relative overflow-hidden border-t border-[#E5E9F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Left-Aligned, Authoritative */}
        <div className="max-w-[560px] text-left space-y-2.5 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B61FF]/10 border border-[#7B61FF]/20 text-[#7B61FF] text-xs font-semibold uppercase tracking-[0.08em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF]" />
            <span>EXECUTIVE OVERVIEW</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] tracking-tight leading-[1.12]">
            One console. Every dollar of revenue risk, visible.
          </h2>

          <p className="text-base text-[#5A5A72] leading-relaxed">
            See recovered revenue, risk exposure, and agent performance in real time — the same view your finance team sees.
          </p>
        </div>

        {/* Elevated Browser-Frame Mockup (Max 1140px, centered) */}
        <div className="max-w-[1140px] mx-auto bg-[#F8F9FC] border border-[#E5E9F0] rounded-2xl shadow-[0_24px_48px_rgba(10,37,64,0.10)] overflow-hidden">
          {/* Top Bar inside Frame */}
          <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-[#E5E9F0] flex flex-wrap items-center justify-between gap-3">
            {/* Left: Window Controls + Logo + Live Environment */}
            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]/80" />
              </div>

              <div className="h-4 w-[1px] bg-[#E5E9F0]" />

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#1E5EFF] text-white flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <span className="text-xs font-bold text-[#1A1A2E] tracking-tight">
                  RecoverFlow Console
                </span>
                <span className="text-[10px] font-mono font-bold text-[#008760] bg-[#00C48C]/10 border border-[#00C48C]/30 px-2 py-0.5 rounded-full flex items-center gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                  Live Production
                </span>
              </div>
            </div>

            {/* Right: Date Range Selector + CFO Avatar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setDateRange((prev) =>
                    prev === "Last 30 days" ? "Last 90 days" : prev === "Last 90 days" ? "Quarter to Date" : "Last 30 days"
                  );
                }}
                title="Click to toggle range"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg text-xs font-medium text-[#1A1A2E] cursor-pointer hover:bg-white transition-colors"
              >
                <span>{dateRange}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A5A72]" />
              </button>

              <div className="flex items-center gap-2 pl-1">
                <div className="w-7 h-7 rounded-full bg-[#0A2540] text-white text-xs font-bold flex items-center justify-center">
                  CF
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#1A1A2E] leading-none">Finance Ops</span>
                  <span className="text-[10px] text-[#5A5A72] font-mono leading-tight">CFO Office</span>
                </div>
              </div>
            </div>
          </div>

          {/* Console Body */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* KPI Row: 4 Cards (Authoritative, Tabular Figures) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* KPI 1 */}
              <div className="p-4 bg-white border border-[#E5E9F0] rounded-xl shadow-xs text-left space-y-1">
                <div className="flex items-center justify-between text-xs text-[#5A5A72]">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Revenue Recovered</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-[#008760] bg-[#00C48C]/10 px-1.5 py-0.5 rounded">
                    ↑ +18.4%
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#1A1A2E] font-mono tabular-nums tracking-tight">
                  ₹42,38,120
                </div>
                <div className="text-[11px] text-[#5A5A72]">
                  vs. ₹35.8M baseline (last 30d)
                </div>
              </div>

              {/* KPI 2 */}
              <div className="p-4 bg-white border border-[#E5E9F0] rounded-xl shadow-xs text-left space-y-1">
                <div className="flex items-center justify-between text-xs text-[#5A5A72]">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Recovery Rate</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-[#008760] bg-[#00C48C]/10 px-1.5 py-0.5 rounded">
                    ↑ +6.1%
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#1E5EFF] font-mono tabular-nums tracking-tight">
                  74.2%
                </div>
                <div className="text-[11px] text-[#5A5A72]">
                  Industry avg: 52.8% on cards
                </div>
              </div>

              {/* KPI 3 */}
              <div className="p-4 bg-white border border-[#E5E9F0] rounded-xl shadow-xs text-left space-y-1">
                <div className="flex items-center justify-between text-xs text-[#5A5A72]">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Active Recoveries</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#008760]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#1A1A2E] font-mono tabular-nums tracking-tight">
                  142
                </div>
                <div className="text-[11px] text-[#5A5A72]">
                  In-flight under policy rules
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-4 bg-white border border-[#E5E9F0] rounded-xl shadow-xs text-left space-y-1">
                <div className="flex items-center justify-between text-xs text-[#5A5A72]">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Agent Actions Today</span>
                  <div className="flex items-center gap-1 text-[#1E5EFF]">
                    <RotateCw className="w-3 h-3" />
                    <Zap className="w-3 h-3" />
                    <BrainCircuit className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1A1A2E] font-mono tabular-nums tracking-tight">
                  1,842
                </div>
                <div className="text-[11px] text-[#5A5A72]">
                  Zero human intervention needed
                </div>
              </div>
            </div>

            {/* Main Visual Row: 60% Area Chart vs. 40% Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* 60% Main Chart: Recovered vs At-Risk */}
              <div className="lg:col-span-7 bg-white border border-[#E5E9F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E9F0]">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A2E]">
                      Recovered vs. At-Risk Revenue Trajectory
                    </h3>
                    <span className="text-[11px] text-[#5A5A72]">
                      30-day continuous recovery curve against gross failed GMV
                    </span>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#1A1A2E]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#7B61FF]" />
                      Recovered (₹42.3M)
                    </span>
                    <span className="flex items-center gap-1.5 text-[#5A5A72]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                      At-Risk (₹37.5M)
                    </span>
                  </div>
                </div>

                {/* Recharts Area Container */}
                <div className="h-[260px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#7B61FF" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#5A5A72" }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#5A5A72" }}
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(val) => [`₹${Number(val).toLocaleString()}`, ""]}
                        contentStyle={{
                          backgroundColor: "#0A2540",
                          borderRadius: "10px",
                          border: "none",
                          color: "#fff",
                          fontSize: "11px",
                          fontFamily: "monospace",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="recovered"
                        stroke="#7B61FF"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRecovered)"
                        name="Recovered Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="atRisk"
                        stroke="#F59E0B"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#colorAtRisk)"
                        name="At-Risk Exposure"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 40% Side Panel: Agent Leaderboard & Top Reasons */}
              <div className="lg:col-span-5 space-y-4">
                {/* Agent Performance Leaderboard */}
                <div className="bg-white border border-[#E5E9F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-3 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E9F0]">
                    <span className="text-xs font-bold text-[#1A1A2E] tracking-tight">
                      Agent Performance
                    </span>
                    <span className="text-[10px] font-mono text-[#5A5A72]">
                      Success Rate
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {AGENT_LEADERBOARD.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-[#1A1A2E]">
                              <ItemIcon className="w-3.5 h-3.5" style={{ color: item.color }} />
                              <span>{item.name}</span>
                            </span>
                            <span className="font-mono font-bold text-[#1A1A2E] text-[11px] tabular-nums">
                              {item.rate}%
                            </span>
                          </div>
                          {/* Horizontal Progress Bar */}
                          <div className="w-full bg-[#F1F4F9] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.rate}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Recovery Reasons */}
                <div className="bg-white border border-[#E5E9F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5 text-left">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E9F0]">
                    <span className="text-xs font-bold text-[#1A1A2E] tracking-tight">
                      Top Recovery Triggers
                    </span>
                    <span className="text-[10px] font-mono text-[#5A5A72]">Share</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {RECOVERY_REASONS.map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#5A5A72] truncate">{r.label}</span>
                        <span className="text-[11px] font-mono font-bold text-[#1A1A2E] flex-shrink-0 tabular-nums">
                          {r.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Live Activity Feed (Inside the Frame) */}
            <div className="bg-white border border-[#E5E9F0] rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1A1A2E]">
                <Activity className="w-3.5 h-3.5 text-[#00C48C]" />
                <span className="uppercase text-[11px] text-[#5A5A72]">Live Stream:</span>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs font-mono text-[#5A5A72] overflow-hidden">
                {LIVE_EVENTS.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-1.5 truncate">
                    <span className="text-[#008760] font-bold">✓</span>
                    <span className="font-semibold text-[#1A1A2E]">{ev.text}</span>
                    <span className="text-[10px] text-[#5A5A72]">({ev.agent})</span>
                    <span className="text-[10px] text-[#A0AEC0]">· {ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Below the Console: 3 Understated Trust Badges */}
        <div className="mt-8 flex items-center justify-center flex-wrap gap-6 sm:gap-10 text-xs font-medium text-[#5A5A72]">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-80">
            <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
            <span>SOC 2 Type II Certified</span>
          </div>

          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-80">
            <BadgeCheck className="w-4 h-4 text-[#1E5EFF]" />
            <span>Razorpay Verified Partner</span>
          </div>

          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-80">
            <Lock className="w-4 h-4 text-[#7B61FF]" />
            <span>Bank-Grade 256-Bit TLS Encryption</span>
          </div>
        </div>
      </div>
    </section>
  );
}
