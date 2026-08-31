"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  RefreshCw,
  Globe,
  ExternalLink,
} from "lucide-react";
import { getUser, logout, AuthUser } from "@/lib/auth";
import { useShell } from "./shell-context";
import { toast } from "sonner";

const ROUTE_TITLES: Record<string, { title: string; breadcrumb: string }> = {
  "/overview": { title: "Executive Command Center", breadcrumb: "Console / Overview" },
  "/opportunities": { title: "Failure Opportunities", breadcrumb: "Console / Opportunities" },
  "/customers": { title: "Customer 360", breadcrumb: "Console / Customers" },
  "/interventions": { title: "Recovery Interventions", breadcrumb: "Audit / Interventions" },
  "/experiments": { title: "A/B Experiments & Lift", breadcrumb: "Growth / Experiments" },
  "/policy": { title: "Policy Guardrails Editor", breadcrumb: "Rules / Policy Engine" },
  "/settings": { title: "API & Integration Settings", breadcrumb: "System / Settings" },
};

function subscribeAuth(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function Topbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { isMobileDrawerOpen, setIsMobileDrawerOpen, environment, toggleEnvironment, searchQuery, setSearchQuery } = useShell();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userJson = useSyncExternalStore(
    subscribeAuth,
    () => JSON.stringify(getUser()),
    () => null
  );
  const user: AuthUser | null = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: "Executive Command Center",
    breadcrumb: "Console / Overview",
  };

  return (
    <header className="h-16 sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-[#E5E9F0] px-4 sm:px-6 flex items-center justify-between select-none">
      {/* Left: Mobile hamburger + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className="lg:hidden p-2 rounded-lg text-[#0F172A] hover:bg-[#F1F4F9] transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5 stroke-[1.5]" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="text-[11px] font-mono font-medium text-[#5B6B84] truncate leading-none mb-1">
            {routeInfo.breadcrumb}
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-[#0F172A] truncate leading-tight tracking-tight">
            {routeInfo.title}
          </h1>
        </div>
      </div>

      {/* Center-Right: Search + Environment + Notifications + Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input (Expands from 200px to 320px on focus) */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-[#5B6B84] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search opportunities..."
            className={`h-9 pl-9 pr-12 rounded-lg bg-white border border-[#E5E9F0] text-xs text-[#0F172A] placeholder-[#5B6B84] transition-all duration-200 outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/15 ${
              searchFocused ? "w-80" : "w-52"
            }`}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#5B6B84] bg-[#F1F4F9] border border-[#E5E9F0] rounded">
            ⌘K
          </kbd>
        </div>

        {/* Environment Badge */}
        <button
          onClick={toggleEnvironment}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-colors cursor-pointer border ${
            environment === "live"
              ? "bg-[#00C48C]/10 text-[#008760] border-[#00C48C]/30 hover:bg-[#00C48C]/20"
              : "bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30 hover:bg-[#F59E0B]/20"
          }`}
          title="Click to toggle between Live and Test environment"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              environment === "live" ? "bg-[#00C48C] animate-pulse" : "bg-[#F59E0B]"
            }`}
          />
          <span>{environment === "live" ? "Live" : "Test Mode"}</span>
        </button>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => toast.info("No unread critical recovery alerts.")}
          aria-label="View notifications"
          className="relative p-2 rounded-lg text-[#5B6B84] hover:text-[#0F172A] hover:bg-[#F1F4F9] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 stroke-[1.5]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F1F4F9] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E5EFF] text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="font-semibold text-[#0F172A]">{user?.full_name || "Admin User"}</div>
              <div className="text-[10px] text-[#5B6B84] capitalize">{user?.role || "support"}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5B6B84]" />
          </button>

          {/* User Menu Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E9F0] rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              <div className="px-3 py-2 border-b border-[#E5E9F0]">
                <div className="font-semibold text-[#0F172A]">{user?.full_name || "Administrator"}</div>
                <div className="text-[11px] text-[#5B6B84] truncate">{user?.email || "admin@recoverflow.dev"}</div>
              </div>

              <button
                onClick={() => {
                  toggleEnvironment();
                  setDropdownOpen(false);
                  toast.success(`Switched to ${environment === "live" ? "Test Sandbox" : "Live Production"}`);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#F8F9FC] flex items-center justify-between text-[#0F172A]"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-[#1E5EFF]" />
                  <span>Switch Environment</span>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#5B6B84]">
                  {environment === "live" ? "To Test" : "To Live"}
                </span>
              </button>

              <Link
                href="/"
                onClick={() => setDropdownOpen(false)}
                className="w-full px-3 py-2 text-left hover:bg-[#F8F9FC] flex items-center justify-between text-[#0F172A]"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#1E5EFF]" />
                  <span>Public Website</span>
                </div>
                <ExternalLink className="w-3 h-3 text-[#5B6B84]" />
              </Link>

              <button
                onClick={() => {
                  logout();
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-rose-50 text-[#EF4444] flex items-center gap-2 border-t border-[#E5E9F0]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
