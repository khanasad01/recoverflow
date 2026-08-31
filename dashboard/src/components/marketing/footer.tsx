"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Award, CheckCircle2, Lock } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-[#0A2540] text-slate-400 border-t border-[#1D3152] pt-16 pb-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Links: 6 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-14 border-b border-[#1D3152]">
          {/* Column 1: Products */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Payments
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Payment Gateway</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Autonomous Recovery</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">UPI Dynamic QR</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Recurring Subscriptions</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Payment Links</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Smart Routing Core</Link></li>
            </ul>
          </div>

          {/* Column 2: Banking & Payouts */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Banking & Payouts
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Instant Payouts (24/7)</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Current Accounts</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Vendor Payments</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Auto-Reconciliation</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">T+0 Settlements</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Escrow Accounts</Link></li>
            </ul>
          </div>

          {/* Column 3: Payroll & HR */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Payroll & HR
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#pricing" className="hover:text-white transition-colors">Automated Payroll</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Tax & TDS Filing</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">PF & ESIC Compliance</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Contractor Disbursals</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Reimbursement Claims</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Form 16 Generation</Link></li>
            </ul>
          </div>

          {/* Column 4: Developers */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Developers
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#developer" className="hover:text-white transition-colors">API Documentation</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Node.js SDK</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Python SDK</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Go & Java Libraries</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Webhook Testing</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Postman Collection</Link></li>
            </ul>
          </div>

          {/* Column 5: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#testimonials" className="hover:text-white transition-colors">E-Commerce & Quick-Commerce</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">SaaS & Subscriptions</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">BFSI & Lending</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Marketplaces</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">EdTech & Gaming</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Cross-Border Trade</Link></li>
            </ul>
          </div>

          {/* Column 6: Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#testimonials" className="hover:text-white transition-colors">About RecoverFlow</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Security & Trust</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Grievance Officer</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition-colors">Responsible Disclosure</Link></li>
            </ul>
          </div>
        </div>

        {/* Middle Brand & Telemetry Bar */}
        <div className="py-8 border-b border-[#1D3152] flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E5EFF] via-[#3395FF] to-[#635BFF] p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0A2540] rounded-[11px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 4C5 3.44772 5.44772 3 6 3H14C17.3137 3 20 5.68629 20 9C20 11.8344 18.0326 14.2096 15.3676 14.8396L19.4142 20.4206C19.8273 21.0028 19.3905 21.8 18.6657 21.8H14.8C14.3644 21.8 13.9592 21.5647 13.7431 21.1848L9.5 13.5H8V21C8 21.5523 7.55228 22 7 22H5.5C4.94772 22 4.5 21.5523 4.5 21V4H5ZM8 6.5V11H13.5C14.8807 11 16 9.88071 16 8.5C16 7.11929 14.8807 6.5 13.5 6.5H8Z" />
                  <circle cx="17" cy="5.5" r="2" fill="#00D4FF" />
                </svg>
              </div>
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Recover<span className="text-[#1E5EFF]">Flow</span>
            </span>
            <span className="text-xs text-slate-500 ml-2">
              Next-generation autonomous payment infrastructure
            </span>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D2D52] border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse" />
            <span className="text-slate-200">All Systems Operational</span>
            <span className="text-slate-500">•</span>
            <span className="text-[#00D4FF]">99.995% Uptime</span>
          </div>
        </div>

        {/* Bottom Compliance & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center flex-wrap gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00C48C]" />
              PCI-DSS Level 1 Compliant
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Award className="w-3.5 h-3.5 text-[#00D4FF]" />
              ISO/IEC 27001:2022 Certified
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3395FF]" />
              SOC 2 Type II Audited
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
              RBI Authorized Payment Aggregator
            </span>
          </div>

          <div>
            © {new Date().getFullYear()} RecoverFlow Technologies Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
