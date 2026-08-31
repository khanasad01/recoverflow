import React from "react";

interface ScoreBarProps {
  score: number; // 0.0 to 1.0 or 0 to 100
  showPercent?: boolean;
  className?: string;
}

export function ScoreBar({ score, showPercent = true, className = "" }: ScoreBarProps) {
  const normalized = score > 1 ? score / 100 : score;
  const pct = Math.round(Math.min(1, Math.max(0, normalized)) * 100);

  let barColor = "bg-[#EF4444]";
  let textColor = "text-[#DC2626]";
  if (pct >= 70) {
    barColor = "bg-[#00C48C]";
    textColor = "text-[#008760]";
  } else if (pct >= 40) {
    barColor = "bg-[#F59E0B]";
    textColor = "text-[#B45309]";
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex-1 h-1.5 bg-[#E5E9F0] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showPercent && (
        <span className={`font-mono text-xs font-semibold ${textColor} w-8 text-right`}>
          {pct}%
        </span>
      )}
    </div>
  );
}
