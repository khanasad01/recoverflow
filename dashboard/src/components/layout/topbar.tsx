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
  "/overview": { title: "Recovery Overview", breadcrumb: "Operations / Recovery Overview" },
  "/opportunities": { title: "Recovery Queue", breadcrumb: "Operations / Recovery Queue" },
  "/interventions": { title: "Recent Autonomous Interventions", breadcrumb: "Autonomous / Interventions" },
  "/customers": { title: "Customers", breadcrumb: "Intelligence / Customers" },
  "/experiments": { title: "Analytics & Lift", breadcrumb: "Revenue / Analytics & Lift" },
  "/policy": { title: "Rules & Workflows", breadcrumb: "Automation / Rules & Workflows" },
  "/settings": { title: "Settings & Integrations", breadcrumb: "Platform / Settings & Integrations" },
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dropdownOpen) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: "Recovery Overview",
    breadcrumb: "Operations / Recovery Overview",
  };

  return (
    <header className="h-16 sticky top-0 z-20 bg-white border-b border-[#E5E9F0] px-4 sm:px-6 flex items-center justify-between select-none shadow-2xs">
      {/* Left: Mobile hamburger + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className="md:hidden p-2 rounded-md text-[#0F172A] hover:bg-[#F1F4F9] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF] cursor-pointer"
          aria-label="Open navigation menu"
          aria-expanded={isMobileDrawerOpen}
        >
          <Menu className="w-5 h-5 stroke-[1.5]" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#5B6B84] truncate leading-none mb-1">
            {routeInfo.breadcrumb}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#0F172A] truncate leading-tight tracking-tight">
            {routeInfo.title}
          </h1>
        </div>
      </div>

      {/* Center-Right: Search + Environment + Notifications + Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-[#5B6B84] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search transactions, customers, opportunities..."
            className={`h-8.5 pl-8.5 pr-12 rounded-md bg-[#F8F9FC] border border-[#E5E9F0] text-xs text-[#0F172A] placeholder-[#94A3B8] transition-all duration-150 outline-none focus:bg-white focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/15 ${
              searchFocused ? "w-80" : "w-64"
            }`}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#5B6B84] bg-white border border-[#E5E9F0] rounded">
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
          className="relative p-2 rounded-lg text-[#5B6B84] hover:text-[#0F172A] hover:bg-[#F1F4F9] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
        >
          <Bell className="w-4 h-4 stroke-[1.5]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F1F4F9] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
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
            <div
              role="menu"
              aria-label="User options"
              className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E9F0] rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
            >
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
