"use client";

import React from "react";
import Link from "next/link";
import { RecoverFlowLogo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="bg-[#0A2540] text-slate-400 border-t border-[#1D3152] pt-16 pb-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Links: 5 Columns (Product, Developers, Integrations, Company, Legal) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pb-14 border-b border-[#1D3152]">
          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Failure Detection</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Smart Recovery Rails</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">UPI Dynamic Links</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Policy Guardrails</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">A/B Lift Testing</Link></li>
            </ul>
          </div>

          {/* Column 2: Developers */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Developers
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#developer" className="hover:text-white transition-colors">API Documentation</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Webhook Ingestion</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">HMAC Verification</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Python & TypeScript SDK</Link></li>
              <li><Link href="#developer" className="hover:text-white transition-colors">Sandbox Testing</Link></li>
            </ul>
          </div>

          {/* Column 3: Integrations */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Integrations
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Razorpay Gateway</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Twilio WhatsApp</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">SendGrid Email</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Custom Webhook Rails</Link></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">About RecoverFlow</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Security Architecture</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Data Processing</Link></li>
            </ul>
          </div>
        </div>

        {/* Middle Brand & Operational Bar */}
        <div className="py-8 border-b border-[#1D3152] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RecoverFlowLogo size="sm" theme="dark" />
            <span className="text-xs text-slate-500 ml-2">
              Payment recovery workflow for Razorpay merchants
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D2D52] border border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
            <span className="text-slate-200">Demo Environment Active</span>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} RecoverFlow. All rights reserved.
          </div>
          <div>
            Built for Razorpay payment failure recovery.
          </div>
        </div>
      </div>
    </footer>
  );
}
