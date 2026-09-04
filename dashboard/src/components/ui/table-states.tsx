"use client";

import React from "react";
import { FolderOpen, AlertTriangle, RefreshCw } from "lucide-react";

export function LoadingTableSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full space-y-3 py-6 px-4">
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="flex items-center gap-4 animate-pulse">
          {[...Array(cols)].map((_, c) => (
            <div
              key={c}
              className="h-7 bg-[#E5E9F0] rounded-md"
              style={{
                flex: c === 0 ? 1.5 : c === 1 ? 2 : 1,
                opacity: 1 - r * 0.12,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingCardSkeleton({
  count = 3,
  className = "grid grid-cols-1 md:grid-cols-3 gap-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-xs animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-[#E5E9F0] rounded w-1/3" />
            <div className="h-4 bg-[#E5E9F0] rounded w-12" />
          </div>
          <div className="h-7 bg-[#E5E9F0] rounded w-1/2" />
          <div className="h-3 bg-[#E5E9F0] rounded w-full" />
          <div className="h-2 bg-[#E5E9F0] rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function LoadingFormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 bg-white border border-[#E5E9F0] rounded-xl p-6 shadow-xs animate-pulse">
      <div className="h-5 bg-[#E5E9F0] rounded w-1/4 mb-4" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3.5 bg-[#E5E9F0] rounded w-32" />
          <div className="h-10 bg-[#F1F4F9] rounded-lg w-full" />
        </div>
      ))}
      <div className="pt-2 flex justify-end gap-2">
        <div className="h-9 bg-[#E5E9F0] rounded-lg w-20" />
        <div className="h-9 bg-[#E5E9F0] rounded-lg w-28" />
      </div>
    </div>
  );
}

export function EmptyTableState({
  title = "No data found",
  description = "No items match your active filters or criteria.",
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-[#F1F4F9] border border-[#E5E9F0] text-[#5B6B84] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
      <p className="text-xs text-[#5B6B84] mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-full bg-[#1E5EFF] text-white hover:bg-[#1649D8] transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorTableState({
  title = "Failed to load data",
  description = "An unexpected error occurred while communicating with the engine.",
  onRetry,
  icon: Icon = AlertTriangle,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  icon?: React.ElementType;
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-[#EF4444] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
      <p className="text-xs text-[#5B6B84] mt-1 leading-relaxed">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-[#E5E9F0] bg-white text-[#0F172A] hover:bg-[#F8F9FC] transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#1E5EFF]" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
