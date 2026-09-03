import React from "react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { RecoveryWorkflowSection } from "@/components/marketing/recovery-workflow-section";
import { ExecutiveOverviewSection } from "@/components/marketing/executive-overview-section";
import { RecoveryControlSection } from "@/components/marketing/recovery-control-section";
import { RazorpayIntegrationSection } from "@/components/marketing/razorpay-integration-section";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingFooter } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0F172A] font-sans antialiased selection:bg-[#1E5EFF] selection:text-white">
      {/* Navigation Bar: Specialized RecoverFlow Branding & Direct Links */}
      <MarketingNavbar />

      <main className="flex-1">
        {/* 01 · Hero Section with Real Recovery Console Interface Mockup */}
        <HeroSection />

        {/* 02 · Problem (Failure Taxonomy) + 03 · Core Engine Workflow + 05 · Production Cases */}
        <RecoveryWorkflowSection />

        {/* 04 · Product Console Preview (Telemetry Dashboard) */}
        <ExecutiveOverviewSection />

        {/* 06 · Merchant Control (Rules) + 07 · Audit Ledger + 08 · Financial Telemetry */}
        <RecoveryControlSection />

        {/* 09 · Razorpay Integration & Webhooks + 10 · Developer Experience Lifecycle Code */}
        <RazorpayIntegrationSection />

        {/* 11 · Final Call to Action */}
        <CtaBand />
      </main>

      {/* 5-Column Enterprise Footer */}
      <MarketingFooter />
    </div>
  );
}
