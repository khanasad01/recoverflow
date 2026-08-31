"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Headphones, Zap } from "lucide-react";

export function CtaBand() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-[#F8F9FC]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0D2D52] to-[#123668] text-white p-10 sm:p-16 lg:p-20 shadow-2xl border border-slate-700/80 text-center">
          {/* Subtle mesh background glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#1E5EFF]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#7B61FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#00D4FF] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Scale with Confidence</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to power your business with Razorpay-grade infrastructure?
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Integrate in minutes, eliminate checkout friction, and let autonomous intelligence recover lost revenue 24 hours a day.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn-pill-primary px-8 py-4 text-base font-semibold w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-fintech-pill"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#developer"
                className="btn-pill-ghost-light px-8 py-4 text-base font-semibold w-full sm:w-auto text-center"
              >
                Explore Sandbox APIs
              </a>
            </div>

            {/* Trust guarantees strip */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-white/10 mt-8">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                No setup fees or hidden costs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                Cancel or upgrade anytime
              </span>
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#00D4FF]" />
                24/7 dedicated engineering support
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
