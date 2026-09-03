"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

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
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0A2540] border border-[#1D3152] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 4C5 3.44772 5.44772 3 6 3H14C17.3137 3 20 5.68629 20 9C20 11.8344 18.0326 14.2096 15.3676 14.8396L19.4142 20.4206C19.8273 21.0028 19.3905 21.8 18.6657 21.8H14.8C14.3644 21.8 13.9592 21.5647 13.7431 21.1848L9.5 13.5H8V21C8 21.5523 7.55228 22 7 22H5.5C4.94772 22 4.5 21.5523 4.5 21V4H5ZM8 6.5V11H13.5C14.8807 11 16 9.88071 16 8.5C16 7.11929 14.8807 6.5 13.5 6.5H8Z" />
                  <circle cx="17" cy="5.5" r="2" fill="#3395FF" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-[#0A2540]">
                Recover<span className="text-[#1E5EFF]">Flow</span>
              </span>
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
              className="btn-pill-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
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
                className="btn-pill-primary w-full py-2.5 text-center text-sm font-semibold justify-center"
              >
                Open Console
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
