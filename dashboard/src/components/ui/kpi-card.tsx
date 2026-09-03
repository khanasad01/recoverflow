import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  contextualExplanation?: string;
  icon: LucideIcon;
  delta?: string;
  isPositive?: boolean;
  accent?: "red" | "green" | "blue" | "neutral";
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  contextualExplanation,
  icon: Icon,
  delta,
  isPositive = true,
  accent = "neutral",
  className = "",
}: KpiCardProps) {
  const iconBg = {
    red: "bg-[#FFE4E6] text-[#E11D48]",
    green: "bg-[#00C48C]/10 text-[#008760]",
    blue: "bg-[#E0F2FE] text-[#0284C7]",
    neutral: "bg-[#F1F5F9] text-[#475569]",
  }[accent];

  return (
    <div
      className={`bg-white border border-[#E5E9F0] rounded-lg p-4.5 shadow-2xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-[#5B6B84] uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-md ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 stroke-[1.75]" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-[26px] font-bold font-mono text-[#0F172A] tracking-tight">
          {value}
        </div>

        {delta && (
          <div className="pt-0.5">
            <span
              className={`inline-flex items-center gap-1 font-mono font-medium text-[11px] px-1.5 py-0.5 rounded ${
                isPositive
                  ? "text-[#008760] bg-[#00C48C]/10"
                  : "text-[#DC2626] bg-[#EF4444]/10"
              }`}
            >
              <span>{isPositive ? "↑" : "↓"}</span>
              <span>{delta}</span>
            </span>
          </div>
        )}

        {(contextualExplanation || subtitle) && (
          <p className="text-[11px] text-[#64748B] leading-tight pt-1">
            {contextualExplanation || subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
