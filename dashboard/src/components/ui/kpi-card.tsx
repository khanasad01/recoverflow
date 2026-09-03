import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  delta?: string;
  isPositive?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delta,
  isPositive = true,
  className = "",
}: KpiCardProps) {
  return (
    <div
      className={`bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#5B6B84] uppercase tracking-wider">
          {title}
        </span>
        <div className="w-10 h-10 rounded-lg bg-[#E8F0FF] text-[#1E5EFF] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-2xl font-semibold font-mono text-[#0F172A] tracking-tight">
          {value}
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          {subtitle ? (
            <span className="text-[#5B6B84] text-[12px]">{subtitle}</span>
          ) : <span />}
          {delta && (
            <span
              className={`inline-flex items-center gap-1 font-medium text-[12px] px-2 py-0.5 rounded-full ${
                isPositive
                  ? "text-[#008760] bg-[#00C48C]/10 border border-[#00C48C]/20"
                  : "text-[#DC2626] bg-[#EF4444]/10 border border-[#EF4444]/20"
              }`}
            >
              <span>{isPositive ? "▲" : "▼"}</span>
              <span>{delta}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
