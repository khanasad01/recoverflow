import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className = "", size = "sm" }: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase().replace(/\s+/g, "_");

  const styles: Record<
    string,
    { bg: string; text: string; border: string; label: string; dot: string }
  > = {
    RECOVERED: {
      bg: "bg-[#00C48C]/10",
      text: "text-[#008760]",
      border: "border-[#00C48C]/30",
      label: "Recovered",
      dot: "bg-[#00C48C]",
    },
    OPEN: {
      bg: "bg-[#1E5EFF]/10",
      text: "text-[#1E5EFF]",
      border: "border-[#1E5EFF]/30",
      label: "Open",
      dot: "bg-[#1E5EFF]",
    },
    SCORED: {
      bg: "bg-[#635BFF]/10",
      text: "text-[#635BFF]",
      border: "border-[#635BFF]/30",
      label: "Scored",
      dot: "bg-[#635BFF]",
    },
    ACTIONED: {
      bg: "bg-[#F59E0B]/10",
      text: "text-[#B45309]",
      border: "border-[#F59E0B]/30",
      label: "Actioned",
      dot: "bg-[#F59E0B]",
    },
    HUMAN_REVIEW: {
      bg: "bg-[#7B61FF]/10",
      text: "text-[#5B41E6]",
      border: "border-[#7B61FF]/30",
      label: "Human Review",
      dot: "bg-[#7B61FF] animate-pulse",
    },
    REJECTED: {
      bg: "bg-[#EF4444]/10",
      text: "text-[#DC2626]",
      border: "border-[#EF4444]/30",
      label: "Rejected",
      dot: "bg-[#EF4444]",
    },
    FAILED: {
      bg: "bg-[#EF4444]/10",
      text: "text-[#DC2626]",
      border: "border-[#EF4444]/30",
      label: "Failed",
      dot: "bg-[#EF4444]",
    },
    CLOSED: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-300",
      label: "Closed",
      dot: "bg-slate-400",
    },
    SUCCESS: {
      bg: "bg-[#00C48C]/10",
      text: "text-[#008760]",
      border: "border-[#00C48C]/30",
      label: "Success",
      dot: "bg-[#00C48C]",
    },
    EXECUTED: {
      bg: "bg-[#1E5EFF]/10",
      text: "text-[#1E5EFF]",
      border: "border-[#1E5EFF]/30",
      label: "Executed",
      dot: "bg-[#1E5EFF]",
    },
    ACTIVE: {
      bg: "bg-[#00C48C]/10",
      text: "text-[#008760]",
      border: "border-[#00C48C]/30",
      label: "Active",
      dot: "bg-[#00C48C]",
    },
    RUNNING: {
      bg: "bg-[#1E5EFF]/10",
      text: "text-[#1E5EFF]",
      border: "border-[#1E5EFF]/30",
      label: "Running",
      dot: "bg-[#1E5EFF] animate-pulse",
    },
    CONCLUDED: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-300",
      label: "Concluded",
      dot: "bg-slate-400",
    },
  };

  const current = styles[normalized] || {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-300",
    label: status || "Unknown",
    dot: "bg-slate-400",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
