"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  Layers,
  ShieldCheck,
  Zap,
  RotateCw,
  Check,
  Code2,
} from "lucide-react";

interface AgentDef {
  id: string;
  number: string;
  name: string;
  shortTitle: string;
  role: string;
  latency: string;
  input: string;
  output: string;
  policyGuardrail: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "risk",
    number: "01",
    name: "Risk Detection Agent",
    shortTitle: "Risk Detection",
    role: "Event Normalization & Graph Ingestion",
    latency: "12ms",
    input: "Razorpay payment.failed webhook payload",
    output: "Opportunity Node in Graph with metadata",
    policyGuardrail: "Cryptographic HMAC SHA256 signature verification",
    description: "Intercepts raw failure payloads from Razorpay gateways in real time. Normalizes varied bank failure codes into unified domain schemas.",
    icon: AlertTriangle,
    accentColor: "#F59E0B",
    badgeBg: "bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30",
  },
  {
    id: "diagnosis",
    number: "02",
    name: "Diagnosis Agent",
    shortTitle: "AI Diagnosis",
    role: "Root Cause Classification & Heuristics",
    latency: "28ms",
    input: "Error codes, bank messages, issuer tokens",
    output: "Failure category (Technical vs. Financial vs. User Abandonment)",
    policyGuardrail: "Excludes hard terminal declines (stolen card, closed account)",
    description: "Evaluates whether payment failure is recoverable. Distinguishes between transient bank downtime and permanent card invalidity.",
    icon: BrainCircuit,
    accentColor: "#635BFF",
    badgeBg: "bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]/30",
  },
  {
    id: "score",
    number: "03",
    name: "Recovery Scoring Agent",
    shortTitle: "Recovery Score",
    role: "Calibrated Machine Learning EV Prediction",
    latency: "18ms",
    input: "Customer tenure, GMV history, failure reason",
    output: "Recoverability probability (0.00–1.00) & EV",
    policyGuardrail: "Probability must clear merchant baseline threshold (default: >0.40)",
    description: "Predicts recovery probability and expected value (EV) using calibrated scikit-learn models trained on hundreds of thousands of Indian banking transitions.",
    icon: TrendingUp,
    accentColor: "#00B4D8",
    badgeBg: "bg-[#00B4D8]/10 text-[#007799] border-[#00B4D8]/30",
  },
  {
    id: "priority",
    number: "04",
    name: "Priority & Ranking Agent",
    shortTitle: "Priority Ranking",
    role: "Dynamic FIFO Queue Arbitration",
    latency: "8ms",
    input: "Batch opportunities + live transaction velocity",
    output: "Ranked dispatch queue ordered by Recovered ARR/sec",
    policyGuardrail: "Enforces max concurrency ceilings per merchant gateway",
    description: "Orders recovery opportunities dynamically. Ensures enterprise-tier customers and high-value transactions receive priority compute.",
    icon: Layers,
    accentColor: "#1E5EFF",
    badgeBg: "bg-[#1E5EFF]/10 text-[#1E5EFF] border-[#1E5EFF]/30",
  },
  {
    id: "policy",
    number: "05",
    name: "Policy & Verification Agent",
    shortTitle: "Policy Guardrails",
    role: "Deterministic Safety Gatekeeper",
    latency: "6ms",
    input: "Proposed action + transaction amount + merchant limits",
    output: "ALLOWED or ESCALATE_TO_HUMAN",
    policyGuardrail: "Requires human review for amounts > ₹50,000 or retry count > 3",
    description: "Compiled ahead-of-time deterministic gatekeeper. Zero hallucinations: strictly enforces user-defined YAML ceilings and regulatory cooling periods.",
    icon: ShieldCheck,
    accentColor: "#7B61FF",
    badgeBg: "bg-[#7B61FF]/10 text-[#5538EE] border-[#7B61FF]/30",
  },
  {
    id: "action",
    number: "06",
    name: "Next-Best-Action Agent",
    shortTitle: "Action Dispatcher",
    role: "Autonomous Multi-Rail Execution",
    latency: "94ms",
    input: "Approved intervention recommendation",
    output: "Dispatched Smart Retry, Payment Link, or Incentive",
    policyGuardrail: "Executes only over authorized Razorpay & UPI endpoints",
    description: "Triggers the highest-probability recovery rail. Dispatches 1-click WhatsApp payment links, smart gateway rerouting, or automated discount incentives.",
    icon: Zap,
    accentColor: "#0A2540",
    badgeBg: "bg-[#0A2540]/10 text-[#0A2540] border-[#0A2540]/30",
  },
  {
    id: "learning",
    number: "07",
    name: "Continuous Learning Agent",
    shortTitle: "Attribution Learning",
    role: "Post-Hoc Attribution & Drift Monitoring",
    latency: "Async",
    input: "Final gateway settlement status",
    output: "Model weight recalibration & A/B lift delta",
    policyGuardrail: "Maintains randomized holdout control groups (default: 20%)",
    description: "Tracks transaction resolution, computes true incremental lift against randomized holdouts, and feeds outcome feedback back into scoring models.",
    icon: RotateCw,
    accentColor: "#00C48C",
    badgeBg: "bg-[#00C48C]/10 text-[#008760] border-[#00C48C]/30",
  },
];

export function ArchitectureSection() {
  const [selectedAgent, setSelectedAgent] = useState<AgentDef>(AGENTS[4]); // Default to Policy & Verification

  const Icon = selectedAgent.icon;

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#F8F9FC] border-y border-[#E5E9F0] relative">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E5EFF]/10 border border-[#1E5EFF]/20 text-[#1E5EFF] text-xs font-semibold tracking-wide uppercase">
            <span>DETERMINISTIC MULTI-AGENT ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight">
            How RecoverFlow Recovers Failed Revenue
          </h2>

          <p className="text-base text-[#5B6B84] leading-relaxed">
            The Hero preview introduces the core flow. Below the surface, 7 specialized agents cooperate to diagnose, rank, govern, and execute recovery across Razorpay payment rails in under 200ms.
          </p>
        </div>

        {/* 7-Agent Horizontal Stepper / Navigator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
          {AGENTS.map((agent) => {
            const AgentIcon = agent.icon;
            const isSelected = selectedAgent.id === agent.id;

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                  isSelected
                    ? "bg-white border-[#1E5EFF] shadow-md ring-2 ring-[#1E5EFF]/20"
                    : "bg-white/80 border-[#E5E9F0] hover:bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#5B6B84]">
                    {agent.number}
                  </span>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${agent.accentColor}18`, color: agent.accentColor }}
                  >
                    <AgentIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {agent.shortTitle}
                  </div>
                  <div className="text-[10px] text-[#5B6B84] font-mono truncate">
                    {agent.latency}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Inspector Card of Selected Agent */}
        <div className="bg-white rounded-2xl border border-[#E5E9F0] shadow-fintech p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Agent Overview */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${selectedAgent.accentColor}18`, color: selectedAgent.accentColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#5B6B84] font-bold">
                      AGENT {selectedAgent.number} OF 07
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${selectedAgent.badgeBg}`}>
                      LATENCY: {selectedAgent.latency}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">
                    {selectedAgent.name}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-[#5B6B84] leading-relaxed">
                {selectedAgent.description}
              </p>

              {/* Data Invariants / Payload Specs */}
              <div className="space-y-2 pt-2 border-t border-[#E5E9F0] font-mono text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-[#5B6B84] w-28 flex-shrink-0 font-semibold">INPUT:</span>
                  <span className="text-[#0F172A] bg-[#F1F4F9] px-2 py-0.5 rounded">{selectedAgent.input}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#5B6B84] w-28 flex-shrink-0 font-semibold">OUTPUT:</span>
                  <span className="text-[#008760] bg-[#00C48C]/10 px-2 py-0.5 rounded font-bold">{selectedAgent.output}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#5B6B84] w-28 flex-shrink-0 font-semibold">GUARDRAIL:</span>
                  <span className="text-[#1E5EFF] bg-[#1E5EFF]/10 px-2 py-0.5 rounded">{selectedAgent.policyGuardrail}</span>
                </div>
              </div>
            </div>

            {/* Right: Live Policy Code / Inspection Snippet */}
            <div className="lg:col-span-5 bg-[#0A2540] rounded-xl p-5 text-white font-mono text-xs space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>runtime_guardrail.rego</span>
                </div>
                <span className="text-[#00C48C] font-bold">COMPILED</span>
              </div>

              <div className="space-y-1 text-slate-300 leading-relaxed text-[11px]">
                <p><span className="text-[#635BFF]">package</span> recoverflow.policy</p>
                <p><span className="text-[#00D4FF]">default</span> allow = <span className="text-[#F59E0B]">false</span></p>
                <br />
                <p><span className="text-slate-500"># Autonomous execution ceiling</span></p>
                <p>allow {"{"}</p>
                <p className="pl-4">input.amount &lt;= <span className="text-[#00C48C]">50000</span></p>
                <p className="pl-4">input.retry_count &lt; <span className="text-[#00C48C]">3</span></p>
                <p className="pl-4">input.agent == <span className="text-[#3395FF]">&quot;{selectedAgent.shortTitle}&quot;</span></p>
                <p>{"}"}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-[#00C48C]">
                  <Check className="w-3 h-3" /> 100% Deterministic Guarantee
                </span>
                <span>Sub-millisecond eval</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
