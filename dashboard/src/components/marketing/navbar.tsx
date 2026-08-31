"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  Users2,
  Banknote,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Zap,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Wallet,
  Receipt,
  FileCheck2,
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

interface MegaCategory {
  title: string;
  badge?: string;
  items: {
    title: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
    href: string;
  }[];
  featured: {
    tag: string;
    headline: string;
    description: string;
    cta: string;
    href: string;
  };
}

const MEGA_MENUS: Record<string, MegaCategory> = {
  payments: {
    title: "Payments & Recovery",
    items: [
      {
        title: "Payment Gateway",
        description: "100+ payment methods with 1-click checkout & 99.995% uptime",
        icon: CreditCard,
        badge: "Core",
        href: "#features",
      },
      {
        title: "Autonomous Recovery",
        description: "Real-time AI smart-routing that rescues 18-24% failed transactions",
        icon: RefreshCw,
        badge: "AI Powered",
        href: "#features",
      },
      {
        title: "Payment Links & QR",
        description: "Share payment links instantly via WhatsApp, SMS, and email",
        icon: Zap,
        href: "#features",
      },
      {
        title: "Recurring Subscriptions",
        description: "Automated recurring billing, mandate management & dunning",
        icon: Layers,
        href: "#features",
      },
    ],
    featured: {
      tag: "FLAGSHIP SUITE",
      headline: "RecoverFlow™ Recovery Engine",
      description:
        "Autonomous multi-agent failover recovers revenue before declines register at customer checkout.",
      cta: "Explore recovery telemetry",
      href: "/overview",
    },
  },
  banking: {
    title: "Banking & Payouts",
    items: [
      {
        title: "Instant Payouts",
        description: "Disburse funds 24/7/365 in real time via IMPS, UPI & RTGS",
        icon: ArrowUpRight,
        badge: "Sub-second",
        href: "#features",
      },
      {
        title: "Current Accounts",
        description: "High-yield business accounts designed for high-velocity software teams",
        icon: Building2,
        href: "#features",
      },
      {
        title: "Vendor Payments & Invoicing",
        description: "Automate invoice reconciliation, GST deduction, and scheduled payouts",
        icon: Receipt,
        href: "#features",
      },
      {
        title: "Automated Ledger",
        description: "Two-way bank statement sync and real-time reconciliation",
        icon: FileCheck2,
        href: "#features",
      },
    ],
    featured: {
      tag: "ENTERPRISE TREASURY",
      headline: "Zero-Latency Settlements",
      description:
        "Access funds on demand with T+0 instant settlements and multi-account intelligent treasury.",
      cta: "Learn about instant settlements",
      href: "#stats",
    },
  },
  payroll: {
    title: "Payroll & HR",
    items: [
      {
        title: "Autonomous Payroll",
        description: "One-click automated salary disbursements directly to bank accounts",
        icon: Users2,
        badge: "Automated",
        href: "#features",
      },
      {
        title: "Tax & Compliance",
        description: "Automated TDS, PF, PT, ESIC filing and instant Form 16 generation",
        icon: ShieldCheck,
        href: "#features",
      },
      {
        title: "Contractor Payouts",
        description: "Disburse cross-border and domestic contractor invoices with zero friction",
        icon: Wallet,
        href: "#features",
      },
      {
        title: "Reimbursements & Perks",
        description: "Digital claim workflows with automated receipt scanning",
        icon: Receipt,
        href: "#features",
      },
    ],
    featured: {
      tag: "100% COMPLIANT",
      headline: "Zero-Penalty Payroll Engine",
      description:
        "Execute month-end payroll in under 3 minutes with built-in statutory compliance.",
      cta: "Schedule a demo",
      href: "#pricing",
    },
  },
  lending: {
    title: "Lending & Capital",
    items: [
      {
        title: "Instant Working Capital",
        description: "Collateral-free credit lines calibrated by transaction volume",
        icon: Banknote,
        badge: "Instant Approval",
        href: "#pricing",
      },
      {
        title: "Corporate Expense Cards",
        description: "Smart virtual and physical corporate credit cards with real-time spend limits",
        icon: CreditCard,
        href: "#pricing",
      },
      {
        title: "Revenue-Based Financing",
        description: "Growth capital for SaaS and D2C brands tied to monthly revenue",
        icon: TrendingUp,
        href: "#pricing",
      },
    ],
    featured: {
      tag: "PRE-APPROVED LIQUIDITY",
      headline: "Scalable Growth Capital",
      description:
        "Access up to ₹5 Crores in non-dilutive working capital within 24 hours of onboarding.",
      cta: "Check credit eligibility",
      href: "#pricing",
    },
  },
};

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasAuth = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => isAuthenticated(),
    () => false
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-250 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E5E9F0] py-3.5"
            : "bg-transparent py-5"
        }`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E5EFF] via-[#3395FF] to-[#635BFF] p-[1.5px] shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-[#0A2540] rounded-[10px] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 4C5 3.44772 5.44772 3 6 3H14C17.3137 3 20 5.68629 20 9C20 11.8344 18.0326 14.2096 15.3676 14.8396L19.4142 20.4206C19.8273 21.0028 19.3905 21.8 18.6657 21.8H14.8C14.3644 21.8 13.9592 21.5647 13.7431 21.1848L9.5 13.5H8V21C8 21.5523 7.55228 22 7 22H5.5C4.94772 22 4.5 21.5523 4.5 21V4H5ZM8 6.5V11H13.5C14.8807 11 16 9.88071 16 8.5C16 7.11929 14.8807 6.5 13.5 6.5H8Z" />
                    <circle cx="17" cy="5.5" r="2" fill="#00D4FF" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-[#0A2540] flex items-center gap-1">
                  Recover<span className="text-[#1E5EFF]">Flow</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#1E5EFF]/10 text-[#1E5EFF] font-mono font-semibold ml-1">
                    ENTERPRISE
                  </span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links with Mega Menu */}
            <nav className="hidden lg:flex items-center gap-1">
              {Object.keys(MEGA_MENUS).map((key) => {
                const menu = MEGA_MENUS[key];
                const isOpen = activeMenu === key;
                return (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => setActiveMenu(key)}
                  >
                    <button
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors ${
                        isOpen
                          ? "text-[#1E5EFF] bg-[#1E5EFF]/5"
                          : "text-[#0A2540] hover:text-[#1E5EFF]"
                      }`}
                    >
                      <span>{menu.title.split(" ")[0]}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isOpen ? "rotate-180 text-[#1E5EFF]" : "text-[#5B6B84]"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              <Link
                href="#developer"
                className="px-3.5 py-2 text-[14px] font-medium text-[#0A2540] hover:text-[#1E5EFF] transition-colors"
              >
                Developers
              </Link>
              <Link
                href="#pricing"
                className="px-3.5 py-2 text-[14px] font-medium text-[#0A2540] hover:text-[#1E5EFF] transition-colors"
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right: Auth & CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {hasAuth ? (
              <Link
                href="/overview"
                className="btn-pill-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
              >
                <span>Console Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#0A2540] hover:text-[#1E5EFF] px-3.5 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="btn-pill-primary px-5 py-2.5 text-sm font-semibold"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            className="lg:hidden p-2 rounded-lg text-[#0A2540] hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop Mega-Menu Dropdown Panel */}
        {activeMenu && MEGA_MENUS[activeMenu] && (
          <div
            className="hidden lg:block absolute top-full left-0 right-0 bg-white border-b border-[#E5E9F0] shadow-xl py-8 animate-in fade-in slide-in-from-top-2 duration-150"
            onMouseEnter={() => setActiveMenu(activeMenu)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-12 gap-8">
              {/* Main Product Items (8 cols) */}
              <div className="col-span-8">
                <div className="text-xs font-bold font-mono tracking-wider text-[#5B6B84] uppercase mb-4">
                  {MEGA_MENUS[activeMenu].title} SUITE
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {MEGA_MENUS[activeMenu].items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setActiveMenu(null)}
                        className="group p-3.5 rounded-xl border border-transparent hover:border-[#E5E9F0] hover:bg-[#F8F9FC] transition-all flex items-start gap-3.5"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E5EFF] group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0A2540] group-hover:text-[#1E5EFF] transition-colors">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5B6B84] mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Featured Card (4 cols) */}
              <div className="col-span-4 bg-[#F8F9FC] border border-[#E5E9F0] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1E5EFF]/15 to-transparent rounded-bl-full pointer-events-none" />
                <div>
                  <span className="inline-block text-[10px] font-mono font-bold tracking-wider text-[#1E5EFF] bg-[#1E5EFF]/10 px-2.5 py-1 rounded-full mb-3">
                    {MEGA_MENUS[activeMenu].featured.tag}
                  </span>
                  <h4 className="text-base font-bold text-[#0A2540] mb-2 leading-snug">
                    {MEGA_MENUS[activeMenu].featured.headline}
                  </h4>
                  <p className="text-xs text-[#5B6B84] leading-relaxed mb-4">
                    {MEGA_MENUS[activeMenu].featured.description}
                  </p>
                </div>
                <Link
                  href={MEGA_MENUS[activeMenu].featured.href}
                  onClick={() => setActiveMenu(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E5EFF] hover:underline"
                >
                  <span>{MEGA_MENUS[activeMenu].featured.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 pb-8 overflow-y-auto lg:hidden flex flex-col justify-between animate-in fade-in duration-200">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-[#E5E9F0] pb-4">
              <div className="text-xs font-mono font-bold text-[#5B6B84] uppercase tracking-wider mb-2">
                Products & Solutions
              </div>
              <Link
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Payment Gateway & Recovery
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Instant Payouts & Neobanking
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Payroll & HR Statutory Compliance
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Working Capital & Corporate Cards
              </Link>
            </div>

            <div className="space-y-2 border-b border-[#E5E9F0] pb-4">
              <Link
                href="#developer"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Developer APIs & Docs
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Pricing & Enterprise Plans
              </Link>
              <Link
                href="#testimonials"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-semibold text-[#0A2540]"
              >
                Customer Stories
              </Link>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            {hasAuth ? (
              <Link
                href="/overview"
                onClick={() => setMobileOpen(false)}
                className="btn-pill-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>Go to Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-pill-primary w-full py-3 text-sm font-semibold"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-pill-secondary w-full py-3 text-sm font-semibold text-center block"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
