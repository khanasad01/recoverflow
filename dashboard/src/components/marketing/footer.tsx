"use client";

import React from "react";
import Link from "next/link";

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
            <div className="w-7 h-7 rounded-lg bg-[#0D2D52] border border-slate-700 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 4C5 3.44772 5.44772 3 6 3H14C17.3137 3 20 5.68629 20 9C20 11.8344 18.0326 14.2096 15.3676 14.8396L19.4142 20.4206C19.8273 21.0028 19.3905 21.8 18.6657 21.8H14.8C14.3644 21.8 13.9592 21.5647 13.7431 21.1848L9.5 13.5H8V21C8 21.5523 7.55228 22 7 22H5.5C4.94772 22 4.5 21.5523 4.5 21V4H5ZM8 6.5V11H13.5C14.8807 11 16 9.88071 16 8.5C16 7.11929 14.8807 6.5 13.5 6.5H8Z" />
                <circle cx="17" cy="5.5" r="2" fill="#3395FF" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              Recover<span className="text-[#1E5EFF]">Flow</span>
            </span>
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
