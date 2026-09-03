"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Zap,
  FlaskConical,
  FileCode2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  ExternalLink,
  X,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useShell } from "./shell-context";

const NAVIGATION_ITEMS = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Recovery Queue", href: "/opportunities", icon: AlertTriangle },
  { name: "Interventions", href: "/interventions", icon: Zap },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Analytics & Lift", href: "/experiments", icon: FlaskConical },
  { name: "Rules & Workflows", href: "/policy", icon: FileCode2 },
  { name: "Settings & Integrations", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleCollapsed, environment, toggleEnvironment } = useShell();
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    router.push("/");
  };

  return (
    <>
      <aside
        className={clsx(
          "bg-[#0A2540] text-white flex flex-col flex-shrink-0 transition-all duration-200 select-none border-r border-[#1D3152] z-30",
          isCollapsed ? "w-[72px]" : "w-[248px]"
        )}
      >
        {/* Brand Header Zone */}
        <div className="h-16 flex items-center px-4 border-b border-[#1D3152] flex-shrink-0">
          <button
            onClick={() => setShowLeaveModal(true)}
            title="Click to return to Public Homepage"
            className="flex items-center gap-3 overflow-hidden text-left cursor-pointer group w-full"
          >
            {/* Geometric Razorpay Rail Mark */}
            <div className="w-8 h-8 rounded-md bg-[#0B1B33] border border-white/15 p-1 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <path d="M13.5 2L4 13.5H11L9.5 22L20 9.5H13L13.5 2Z" fill="#E11D48" />
                <path d="M3 5C5.5 3 8.5 2 12 2C17.5 2 22 6.5 22 12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold tracking-tight text-white flex items-center justify-between gap-1 truncate">
                  <span>Recover<span className="text-[#E11D48]">Flow</span></span>
                  <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" />
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-sans text-white/50 tracking-wide">by</span>
                  <span className="text-[9px] font-bold text-[#E11D48] tracking-wider uppercase">Razorpay</span>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Merchant Workspace Selector */}
        {!isCollapsed ? (
          <div className="px-3 pt-3 pb-1">
            <div className="bg-[#0B1B33] border border-[#1D3152] rounded-md px-2.5 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">Acme Technologies</div>
                <div className="text-[9px] font-mono text-[#94A3B8] truncate">MID: #rzp_live_89104</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse flex-shrink-0 ml-2" title="Razorpay Webhook Stream: Active" />
            </div>
          </div>
        ) : (
          <div className="py-2 flex justify-center">
            <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse" title="Connected: rzp_live_89104" />
          </div>
        )}

        {/* Navigation List */}
        <div className="px-2 py-3 flex-1 space-y-0.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-white/40">
              Recovery Operations
            </div>
          )}
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all relative group",
                  isActive
                    ? "bg-white/[0.08] text-white font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-[#E11D48] before:rounded-r"
                    : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0 stroke-[1.75]" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Bottom Pinned Zone: Environment, Status, Collapse Toggle */}
        <div className="p-3 border-t border-[#1D3152] bg-[#0B1B33] space-y-2">
          {/* Public Website Quick Link */}
          <button
            onClick={() => setShowLeaveModal(true)}
            title="Return to Public Marketing Website"
            className="w-full flex items-center gap-2.5 p-1.5 rounded hover:bg-white/[0.05] text-white/70 hover:text-white transition-colors cursor-pointer text-xs text-left"
          >
            <Globe className="w-3.5 h-3.5 flex-shrink-0 text-[#38BDF8]" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="text-[11px] font-medium text-white/80">Public Website</span>
                <ExternalLink className="w-3 h-3 text-white/40" />
              </div>
            )}
          </button>

          {/* Environment Indicator / Toggle */}
          <button
            onClick={toggleEnvironment}
            title="Click to switch environment"
            className={clsx(
              "w-full flex items-center gap-2 p-1.5 rounded border text-xs font-mono transition-colors text-left",
              environment === "live"
                ? "bg-[#00C48C]/10 border-[#00C48C]/30 text-[#00C48C] hover:bg-[#00C48C]/15"
                : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/15"
            )}
          >
            <span
              className={clsx(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                environment === "live" ? "bg-[#00C48C] animate-pulse" : "bg-[#F59E0B]"
              )}
            />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="font-bold uppercase tracking-wider text-[9px]">
                  {environment === "live" ? "Razorpay Live" : "Sandbox Test"}
                </span>
                <span className="text-[9px] text-white/50 underline">Switch</span>
              </div>
            )}
          </button>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full hidden lg:flex items-center justify-center p-1.5 rounded hover:bg-white/[0.04] text-white/60 hover:text-white transition-colors cursor-pointer text-xs"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 w-full px-1">
                <PanelLeftClose className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[10px] text-white/50">Collapse sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Confirmation Dialog: Leaving Console to Public Homepage */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowLeaveModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#E5E9F0] shadow-2xl max-w-sm w-full p-6 z-10 space-y-4 animate-in zoom-in-95 duration-150 text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E8F0FF] text-[#1E5EFF] flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A]">Leave Executive Console?</h4>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-lg text-[#5B6B84] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B6B84] leading-relaxed">
              You are navigating to the public RecoverFlow website (<code className="font-mono text-[#0F172A] bg-[#F1F4F9] px-1 py-0.5 rounded">/</code>). Your authenticated session remains active in the background until you choose to log out.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="btn-pill-secondary px-4 py-2 text-xs font-semibold"
              >
                Stay in Console
              </button>
              <button
                onClick={handleConfirmLeave}
                className="btn-pill-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Return to Homepage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
