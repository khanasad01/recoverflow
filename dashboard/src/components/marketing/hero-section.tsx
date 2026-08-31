"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Layers,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";

interface PipelineNode {
  id: string;
  stepNumber: string;
  name: string;
  shortLabel: string;
  detail: string;
  explanation: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  isActive?: boolean;
  isResolved?: boolean;
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: "events",
    stepNumber: "01",
    name: "Razorpay Events",
    shortLabel: "Events",
    detail: "payment.failed webhook (HMAC OK)",
    explanation: "Streams real-time payment decline events directly from Razorpay webhooks with cryptographic HMAC verification.",
    icon: Layers,
    iconColor: "#1E5EFF",
    bgColor: "bg-[#1E5EFF]/10",
    borderColor: "border-[#1E5EFF]/20",
  },
  {
    id: "risk",
    stepNumber: "02",
    name: "Risk Detection",
    shortLabel: "Risk Graph",
    detail: "Opportunity Graph mapped (42ms)",
    explanation: "Detects drop-off risk and builds a linked opportunity node in the graph within 42ms.",
    icon: AlertTriangle,
    iconColor: "#F59E0B",
    bgColor: "bg-[#F59E0B]/10",
    borderColor: "border-[#F59E0B]/20",
  },
  {
    id: "diagnosis",
    stepNumber: "03",
    name: "AI Diagnosis",
    shortLabel: "Diagnosis",
    detail: "Card network decline · Recoverable",
    explanation: "Identifies why the payment failed and whether it is recoverable across technical, financial, and user drop-off categories.",
    icon: Sparkles,
    iconColor: "#1E5EFF",
    bgColor: "bg-[#1E5EFF]/15",
    borderColor: "border-[#1E5EFF]/30",
    isActive: true,
  },
  {
    id: "score",
    stepNumber: "04",
    name: "Recovery Score",
    shortLabel: "ML Score",
    detail: "Prob: 0.88 · EV ₹14,850",
    explanation: "Estimates recovery probability and expected recovery net value (EV) using calibrated scikit-learn models.",
    icon: TrendingUp,
    iconColor: "#00B4D8",
    bgColor: "bg-[#00B4D8]/10",
    borderColor: "border-[#00B4D8]/20",
  },
  {
    id: "action",
    stepNumber: "05",
    name: "Next-Best-Action",
    shortLabel: "Action Agent",
    detail: "Policy OK · Auto-switch to UPI",
    explanation: "Validates deterministic policy ceilings before autonomously triggering the highest-probability recovery rail.",
    icon: Zap,
    iconColor: "#7B61FF",
    bgColor: "bg-[#7B61FF]/10",
    borderColor: "border-[#7B61FF]/20",
  },
  {
    id: "recovered",
    stepNumber: "06",
    name: "Recovered ✓",
    shortLabel: "Recovered",
    detail: "₹14,850 Rescued via UPI Link",
    explanation: "Payment successfully captured on alternative rail; transaction ledger marked RECOVERED in 184ms.",
    icon: CheckCircle2,
    iconColor: "#00C48C",
    bgColor: "bg-[#00C48C]/15",
    borderColor: "border-[#00C48C]/40",
    isResolved: true,
  },
];

export function HeroSection() {
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<PipelineNode>(PIPELINE_NODES[2]); // Default to AI Diagnosis

  return (
    <section className="relative overflow-hidden fintech-mesh-bg w-full">
      {/* Background Soft Mesh Glow - Centered behind hero */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[540px] bg-gradient-to-tr from-[#1E5EFF]/10 via-[#635BFF]/08 to-[#7B61FF]/06 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Main Hero Container: 52% left / 44% right split, 64px gap */}
      <div className="hero-section">
        {/* 1. LEFT COLUMN: Messaging */}
        <div className="hero-left text-center md:text-left items-center md:items-start">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B61FF]/10 border border-[#7B61FF]/20 text-[#7B61FF] text-xs font-semibold uppercase tracking-[0.08em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF]" />
            <span>POWERED BY RAZORPAY · AI RECOVERY ENGINE</span>
          </div>

          {/* H1 Headline */}
          <h1 className="text-[36px] sm:text-[44px] lg:text-[56px] font-bold text-[#1A1A2E] tracking-tight leading-[1.05]">
            Every payment failure is a recoverable opportunity.
          </h1>

          {/* Subhead */}
          <p className="text-[16px] sm:text-[18px] text-[#5A5A72] font-normal leading-[1.6] max-w-[460px]">
            RecoverFlow works alongside Razorpay — reading every payment event, diagnosing risk in real time, and letting AI agents recover, retry, or escalate, all within the guardrails you set.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
            <button
              onClick={() => router.push("/login")}
              className="h-12 px-7 rounded-full bg-gradient-to-r from-[#1E5EFF] to-[#7B61FF] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              <span>Start Recovering Revenue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="#how-it-works"
              className="text-sm font-semibold text-[#1A1A2E] hover:text-[#1E5EFF] hover:underline px-2 py-2 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>How it works</span>
              <span>→</span>
            </Link>
          </div>

          {/* Trust Strip: 3 Stat Chips */}
          <div className="pt-4 border-t border-[#E5E9F0] w-full max-w-[500px]">
            <div className="flex items-center justify-center md:justify-start flex-wrap gap-2.5">
              <span className="px-3 py-1.5 rounded-full border border-[#E5E9F0] bg-[#F8F9FC] text-xs font-mono font-semibold text-[#1A1A2E] tabular-nums">
                ₹42Cr+ recovered
              </span>
              <span className="px-3 py-1.5 rounded-full border border-[#00C48C]/30 bg-[#00C48C]/10 text-xs font-mono font-semibold text-[#008760] tabular-nums">
                18% incremental lift
              </span>
              <span className="px-3 py-1.5 rounded-full border border-[#E5E9F0] bg-[#F8F9FC] text-xs font-mono font-semibold text-[#5A5A72]">
                Native Razorpay integration
              </span>
            </div>
          </div>
        </div>

        {/* 2. RIGHT COLUMN: 6-Node Pipeline Visual */}
        <div className="hero-right">
          {/* Centered Ambient Mesh Glow */}
          <div className="absolute inset-0 m-auto w-[92%] h-[92%] bg-gradient-to-tr from-[#1E5EFF]/08 via-[#635BFF]/06 to-[#7B61FF]/08 rounded-3xl blur-2xl -z-10 pointer-events-none" />

          {/* Bounded Card */}
          <div className="mockup-card bg-white rounded-2xl border border-[#E5E9F0] shadow-fintech p-4 sm:p-5 w-full relative overflow-hidden space-y-3">
            {/* Header: Title & Latency Tag */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E9F0]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <span className="text-xs font-bold text-[#1A1A2E] tracking-tight">
                  Autonomous Recovery Pipeline
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#008760] bg-[#00C48C]/10 px-2 py-0.5 rounded-full border border-[#00C48C]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
                <span>184ms Telemetry</span>
              </div>
            </div>

            {/* Desktop Vertical Stack (connected by slow 2.5s dash flow lines) */}
            <div className="hidden md:block space-y-1 relative">
              {PIPELINE_NODES.map((node, index) => {
                const Icon = node.icon;
                const isHovered = hoveredNode.id === node.id;
                const isLast = index === PIPELINE_NODES.length - 1;

                return (
                  <div key={node.id} className="relative">
                    {/* Rounded pill card (16px radius) */}
                    <div
                      onMouseEnter={() => setHoveredNode(node)}
                      className={`group flex items-center justify-between p-2.5 rounded-[16px] border transition-all duration-150 cursor-pointer ${
                        node.isActive
                          ? "bg-white border-[#1E5EFF] ring-2 ring-[#1E5EFF]/15 shadow-[0_0_24px_rgba(30,94,255,0.15)]"
                          : node.isResolved
                          ? "bg-[#00C48C]/05 border-[#00C48C]/40 hover:border-[#00C48C] py-3"
                          : isHovered
                          ? "bg-white border-[#1E5EFF]/40 shadow-xs"
                          : "bg-[#F8F9FC] border-[#E5E9F0] hover:bg-white hover:border-[#CBD5E1]"
                      }`}
                    >
                      {/* Left: Icon + Label + Subtitle */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                            node.bgColor
                          } ${node.borderColor} border`}
                          style={{ color: node.iconColor }}
                        >
                          <Icon className={`${node.isResolved ? "w-4 h-4" : "w-3.5 h-3.5"} stroke-[1.5]`} />
                        </div>

                        <div className="flex flex-col min-w-0 text-left">
                          <span className={`text-xs font-bold text-[#1A1A2E] truncate ${node.isResolved ? "text-[#008760]" : ""}`}>
                            {node.name}
                          </span>
                          <span className="text-[11px] font-mono text-[#5A5A72] truncate">
                            {node.detail}
                          </span>
                        </div>
                      </div>

                      {/* Right: Active halo or step tag */}
                      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                        {node.isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#1E5EFF] bg-[#1E5EFF]/10 px-2 py-0.5 rounded-full border border-[#1E5EFF]/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E5EFF] animate-ping" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                        {node.isResolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#008760] bg-[#00C48C]/15 px-2 py-0.5 rounded-full border border-[#00C48C]/40">
                            <span>RESCUED</span>
                          </span>
                        )}
                        {!node.isActive && !node.isResolved && (
                          <span className="text-[10px] font-mono text-[#5A5A72]">
                            {node.stepNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thin animated dash-flow connector (2.5s loop, only moving element) */}
                    {!isLast && (
                      <div className="flex items-center justify-center py-0.5">
                        <svg width="2" height="10" viewBox="0 0 2 10" className="overflow-visible">
                          <line
                            x1="1"
                            y1="0"
                            x2="1"
                            y2="10"
                            stroke="#E5E9F0"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="1"
                            y1="0"
                            x2="1"
                            y2="10"
                            stroke="#1E5EFF"
                            strokeWidth="1.5"
                            className="animate-flow-dash"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile View: Horizontal Scroll Strip with Snap */}
            <div className="md:hidden flex items-center overflow-x-auto gap-2.5 pb-2 pt-1 snap-x scrollbar-none">
              {PIPELINE_NODES.map((node) => {
                const Icon = node.icon;
                const isSelected = hoveredNode.id === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => setHoveredNode(node)}
                    className={`flex-shrink-0 snap-start flex items-center gap-2 px-3 py-2 rounded-[14px] border text-left cursor-pointer transition-all ${
                      node.isActive
                        ? "bg-white border-[#1E5EFF] ring-1 ring-[#1E5EFF]/30 shadow-xs"
                        : node.isResolved
                        ? "bg-[#00C48C]/10 border-[#00C48C]/40 text-[#008760]"
                        : isSelected
                        ? "bg-white border-[#1E5EFF]/40"
                        : "bg-[#F8F9FC] border-[#E5E9F0]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${node.bgColor}`}
                      style={{ color: node.iconColor }}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#1A1A2E] truncate">
                        {node.shortLabel}
                      </span>
                      <span className="text-[10px] font-mono text-[#5A5A72] truncate">
                        Step {node.stepNumber}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hover Tooltip: 1-line plain-language explanation */}
            <div className="p-2.5 rounded-xl bg-[#F8F9FC] border border-[#E5E9F0] flex items-start gap-2 text-left">
              <Info className="w-3.5 h-3.5 text-[#1E5EFF] flex-shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="text-[11px] text-[#5A5A72] leading-tight">
                <strong className="text-[#1A1A2E]">{hoveredNode.name}:</strong>{" "}
                {hoveredNode.explanation}
              </div>
            </div>

            {/* Footer Trust Guarantee */}
            <div className="pt-2 border-t border-[#E5E9F0] flex items-center justify-between text-[10px] text-[#5A5A72] font-mono">
              <span className="flex items-center gap-1 text-[#008760]">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                Deterministic Guardrails Enforced
              </span>
              <span>100% Audit Logged</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
