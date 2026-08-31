"use client";

import React from "react";
import Link from "next/link";
import {
  CreditCard,
  RefreshCw,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Building2,
} from "lucide-react";

export function BentoGrid() {
  return (
    <section id="products" className="py-24 lg:py-32 bg-[#FFFFFF]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] text-xs font-semibold uppercase tracking-wider">
            <span>Modular Fintech Stack</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0A2540] tracking-tight leading-tight">
            Comprehensive payments stack, purpose-built to scale
          </h2>
          <p className="text-base sm:text-lg text-[#5B6B84] leading-relaxed">
            Everything your business needs to accept customer payments, autonomously rescue failed transactions, and manage treasury with enterprise-grade reliability.
          </p>
        </div>

        {/* Bento Grid: 2 rows with asymmetric layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1 (Large - Spans 7 cols on Desktop) */}
          <div className="md:col-span-7 fintech-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-3 z-10">
              <div className="w-12 h-12 rounded-xl bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#0A2540]">
                  Unified Payment Gateway & Checkout Suite
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[#00C48C]">
                  99.995% SLA
                </span>
              </div>
              <p className="text-sm text-[#5B6B84] leading-relaxed max-w-lg">
                Accept UPI, cards, net banking, wallets, and EMI with an intelligent, adaptive checkout that optimizes for customer conversion and tokenized security.
              </p>
            </div>

            {/* Embedded Micro-UI Preview */}
            <div className="mt-8 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#5B6B84] border-b border-[#E5E9F0] pb-2">
                <span className="font-semibold text-[#0A2540]">Supported Payment Rails</span>
                <span className="font-mono text-[#1E5EFF]">100+ Methods</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-[#E5E9F0] flex items-center gap-2 font-medium text-[#0A2540]">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                  <span>Instant UPI QR</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#E5E9F0] flex items-center gap-2 font-medium text-[#0A2540]">
                  <span className="w-2 h-2 rounded-full bg-[#1E5EFF]" />
                  <span>Tokenized Cards</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#E5E9F0] flex items-center gap-2 font-medium text-[#0A2540]">
                  <span className="w-2 h-2 rounded-full bg-[#635BFF]" />
                  <span>NetBanking (58+)</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#5B6B84]">
                <span>Average authorization latency: <strong className="text-[#0A2540]">142ms</strong></span>
                <span className="text-[#00C48C] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RBI Compliant
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex items-center justify-between">
              <Link href="#features" className="text-sm font-bold text-[#1E5EFF] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                <span>Explore checkout architecture</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2 (Spans 5 cols on Desktop) */}
          <div className="md:col-span-5 fintech-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-3 z-10">
              <div className="w-12 h-12 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0A2540]">
                RecoverFlow™ Autonomous Recovery
              </h3>
              <p className="text-sm text-[#5B6B84] leading-relaxed">
                Proprietary AI routing detects bank downtime in real time and cascades declined payments across backup acquiring rails before failures register.
              </p>
            </div>

            {/* Embedded Telemetry Gauge */}
            <div className="mt-8 bg-[#0A2540] text-white rounded-xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-mono">RECOVERY ENGINE V4</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00C48C]/20 text-[#00C48C]">
                  +23.8% LIFT
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white">₹14.8M</span>
                <span className="text-xs text-slate-400">rescued this quarter</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[84%] h-full bg-gradient-to-r from-[#1E5EFF] to-[#00C48C] rounded-full" />
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
                <span>Interventions: 42,910</span>
                <span>Zero user disruption</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex items-center justify-between">
              <Link href="/overview" className="text-sm font-bold text-[#1E5EFF] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                <span>View recovery live feed</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3 (Spans 5 cols on Desktop) */}
          <div className="md:col-span-5 fintech-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-3 z-10">
              <div className="w-12 h-12 rounded-xl bg-[#00C48C]/10 text-[#00C48C] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0A2540]">
                Instant Payouts & Neobanking
              </h3>
              <p className="text-sm text-[#5B6B84] leading-relaxed">
                Disburse vendor invoices, seller settlements, and customer refunds instantly via automated APIs with zero weekend delays or reconciliation lag.
              </p>
            </div>

            {/* Embedded Payout Status */}
            <div className="mt-8 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0A2540]">Instant IMPS & UPI</span>
                <span className="font-mono text-[#00C48C] font-bold">T+0 Real-Time</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E5E9F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                  <span className="text-[#0A2540] font-medium">Batch Disbursal #4092</span>
                </div>
                <span className="font-mono text-[11px] text-[#5B6B84]">1,420 Txns / 2.1s</span>
              </div>
              <p className="text-[11px] text-[#5B6B84] pt-1">
                Automated webhook reconciliation and error retries.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex items-center justify-between">
              <Link href="#features" className="text-sm font-bold text-[#1E5EFF] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                <span>Learn about instant payouts</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 4 (Spans 7 cols on Desktop) */}
          <div className="md:col-span-7 fintech-card p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group">
            <div className="space-y-3 z-10">
              <div className="w-12 h-12 rounded-xl bg-[#7B61FF]/10 text-[#7B61FF] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#0A2540]">
                  Corporate Cards & Working Capital
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF]">
                  Up to ₹5 Cr
                </span>
              </div>
              <p className="text-sm text-[#5B6B84] leading-relaxed max-w-lg">
                Fuel inventory and growth with collateral-free credit lines calculated by real transaction volume. Issue programmable cards with automated expense policies.
              </p>
            </div>

            {/* Embedded Credit Card Mockup */}
            <div className="mt-8 bg-gradient-to-tr from-[#0A2540] via-[#0F2D54] to-[#1D3B6C] text-white rounded-xl p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Enterprise Corporate Line
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-white">
                  ₹50,00,000.00
                </div>
                <div className="text-[11px] text-slate-300">
                  Pre-approved liquidity based on GMV history
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/15 text-xs space-y-1 w-full sm:w-auto">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Spend Control:</span>
                  <span className="text-[#00D4FF] font-mono">Strict $10k/day</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Reward Rate:</span>
                  <span className="text-[#00C48C] font-mono">2.5% Cashback</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E9F0] flex items-center justify-between">
              <Link href="#pricing" className="text-sm font-bold text-[#1E5EFF] inline-flex items-center gap-1.5 group-hover:gap-2 transition-all">
                <span>Check capital eligibility</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
