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

export function EmptyTableState({
  title = "No data found",
  description = "No items match your active filters or criteria.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-[#F1F4F9] border border-[#E5E9F0] text-[#5B6B84] flex items-center justify-center mb-3">
        <FolderOpen className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
      <p className="text-xs text-[#5B6B84] mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-full bg-[#1E5EFF] text-white hover:bg-[#1649D8] transition-colors"
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
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-[#EF4444] flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
      <p className="text-xs text-[#5B6B84] mt-1 leading-relaxed">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-[#E5E9F0] bg-white text-[#0F172A] hover:bg-[#F8F9FC] transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#1E5EFF]" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
