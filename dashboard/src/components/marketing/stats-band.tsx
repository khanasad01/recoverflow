"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Award, Zap } from "lucide-react";

export function StatsBand() {
  const stats = [
    {
      value: "₹12.5T+",
      label: "Annual Volume Processed",
      detail: "Equivalent to $150B+ across 130+ currencies",
    },
    {
      value: "10M+",
      label: "Verified Businesses",
      detail: "From fast-moving startups to Fortune 500 enterprises",
    },
    {
      value: "99.995%",
      label: "System Uptime SLA",
      detail: "Multi-region redundant cloud cluster architecture",
    },
    {
      value: "< 180ms",
      label: "Median Gateway Latency",
      detail: "Sub-second checkout authorization with direct bank APIs",
    },
  ];

  return (
    <section id="stats" className="bg-[#0A2540] text-white py-20 lg:py-28 relative overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1E5EFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#635BFF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow and Section Subhead */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-bold tracking-widest text-[#00D4FF] uppercase">
            SCALE & RELIABILITY
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Built for national-scale transaction throughput
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Engineered to sustain peak flash sale loads without degradation or dropped transactions.
          </p>
        </div>

        {/* 4 Large Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-16 border-b border-[#1D3152]">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-2 text-center sm:text-left">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#3395FF] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-base font-bold text-slate-100">
                {stat.label}
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Certifications and Compliance strip */}
        <div className="pt-10 flex flex-wrap items-center justify-center lg:justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
            <span className="font-semibold text-slate-200">PCI-DSS Level 1</span>
            <span className="text-slate-500">Highest security standard</span>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00D4FF]" />
            <span className="font-semibold text-slate-200">ISO/IEC 27001:2022</span>
            <span className="text-slate-500">Certified information security</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3395FF]" />
            <span className="font-semibold text-slate-200">SOC 2 Type II</span>
            <span className="text-slate-500">Audited operational controls</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <span className="font-semibold text-slate-200">RBI Authorized PA</span>
            <span className="text-slate-500">In-principle approved aggregator</span>
          </div>
        </div>
      </div>
    </section>
  );
}
