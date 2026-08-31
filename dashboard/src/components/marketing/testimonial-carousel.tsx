"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Star, CheckCircle2, TrendingUp } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  metric: string;
  quote: string;
  avatarBg: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Aadit Palicha",
    role: "Co-Founder & CEO",
    company: "Zepto",
    metric: "+3.8% Overall Capture Rate",
    quote:
      "During 10-minute delivery flash surges, every hundred milliseconds and decline point directly impacts customer trust. RecoverFlow and Razorpay-grade checkout architecture gave us 99.99% availability and rescued millions in at-risk GMV effortlessly.",
    avatarBg: "bg-emerald-600",
    initials: "AP",
  },
  {
    name: "Sriharsha Majety",
    role: "Co-Founder & CEO",
    company: "Swiggy",
    metric: "$1.4M Rescued in Q3 Alone",
    quote:
      "The autonomous routing engine automatically shields us from acquirer-side downtime. Rather than failing orders, it reroutes traffic across our banking partners dynamically. It is by far the most resilient payments stack in India.",
    avatarBg: "bg-orange-600",
    initials: "SM",
  },
  {
    name: "Nithin Kamath",
    role: "Founder & CEO",
    company: "Zerodha",
    metric: "3-Day Fast Integration Cycle",
    quote:
      "When market volatility peaks, our funds load volumes multiply by 10x. Their APIs, webhook reliability, and automated reconciliation handle peak banking traffic without a single dropped settlement.",
    avatarBg: "bg-blue-600",
    initials: "NK",
  },
  {
    name: "Varun Dua",
    role: "Founder & CEO",
    company: "ACKO Insurance",
    metric: "99.94% Instant Payout SLA",
    quote:
      "For claims disbursals, speed is everything. We shifted our instant claims payouts to RecoverFlow's T+0 automated rails, allowing us to disburse approved claims directly to policyholders in under 60 seconds.",
    avatarBg: "bg-purple-600",
    initials: "VD",
  },
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const item = TESTIMONIALS[currentIndex];

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-[#FFFFFF]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#1E5EFF] uppercase">
              CUSTOMER STORIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A2540]">
              Validated by founders moving billions
            </h2>
            <p className="text-base text-[#5B6B84]">
              See how India&apos;s leading technology leaders scale transaction reliability with our payments engine.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              aria-label="Previous story"
              className="w-11 h-11 rounded-full border border-[#E5E9F0] hover:border-[#0A2540] hover:bg-[#F8F9FC] flex items-center justify-center text-[#0A2540] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next story"
              className="w-11 h-11 rounded-full border border-[#E5E9F0] hover:border-[#0A2540] hover:bg-[#F8F9FC] flex items-center justify-center text-[#0A2540] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Featured Testimonial Card with Colored Accent Border */}
        <div className="fintech-card p-8 sm:p-12 border-l-4 border-l-[#1E5EFF] shadow-fintech relative overflow-hidden transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Quote Body (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <span className="text-xs font-bold text-[#0A2540] ml-2">Verified Enterprise Partner</span>
              </div>

              <blockquote className="text-lg sm:text-2xl font-medium text-[#0A2540] leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 pt-2">
                <div
                  className={`w-12 h-12 rounded-full ${item.avatarBg} text-white font-bold flex items-center justify-center text-base flex-shrink-0 shadow-sm`}
                >
                  {item.initials}
                </div>
                <div>
                  <div className="font-bold text-base text-[#0A2540]">{item.name}</div>
                  <div className="text-xs text-[#5B6B84]">
                    {item.role}, <strong className="text-[#0A2540]">{item.company}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Metric Card (4 cols) */}
            <div className="lg:col-span-4 bg-[#F8F9FC] border border-[#E5E9F0] rounded-2xl p-6 space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1E5EFF] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Measured Business Impact
              </div>
              <div className="text-2xl font-bold font-mono text-[#0A2540]">
                {item.metric}
              </div>
              <p className="text-xs text-[#5B6B84] leading-relaxed">
                Audited against baseline control traffic over 90 days of continuous production routing.
              </p>
              <div className="pt-2 border-t border-[#E5E9F0] flex items-center gap-2 text-[11px] text-[#00C48C] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Production Telemetry
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Jump to testimonial ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? "w-8 bg-[#1E5EFF]" : "w-2 bg-[#E5E9F0] hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
