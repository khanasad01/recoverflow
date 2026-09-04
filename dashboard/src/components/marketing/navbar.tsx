"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

import { RecoverFlowLogo } from "@/components/brand/logo";

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Product", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Integrations", href: "#integrations" },
    { name: "Developers", href: "#developer" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-[#E5E9F0] py-3.5"
            : "bg-white/80 backdrop-blur-xs border-b border-[#E5E9F0]/60 py-4"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Brand Logo & Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <RecoverFlowLogo size="md" theme="light" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-3.5 py-2 text-sm font-medium text-[#5B6B84] hover:text-[#0A2540] hover:bg-slate-50 rounded-md transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Sign in & Open Console */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#5B6B84] hover:text-[#0A2540] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/overview"
              className="px-4 py-2 text-xs font-semibold rounded-md bg-[#0A2540] hover:bg-[#123359] text-white border border-[#1D3152] shadow-xs inline-flex items-center gap-1.5 transition-all duration-150"
            >
              <span>Open Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            className="md:hidden p-2 rounded-lg text-[#0A2540] hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden pt-20 bg-white/98 backdrop-blur-md px-6 pb-8 border-b border-[#E5E9F0] animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-3 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-base font-medium text-[#0A2540] border-b border-slate-100"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold text-[#0A2540] border border-[#E5E9F0] rounded-lg"
              >
                Sign in
              </Link>
              <Link
                href="/overview"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-[#0A2540] hover:bg-[#123359] text-white border border-[#1D3152] shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
