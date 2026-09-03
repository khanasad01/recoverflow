import React from "react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { ExecutiveOverviewSection } from "@/components/marketing/executive-overview-section";
import { ArchitectureSection } from "@/components/marketing/architecture-section";
import { BentoGrid } from "@/components/marketing/bento-grid";
import { FeatureDeepDives } from "@/components/marketing/feature-deep-dives";
import { DeveloperSection } from "@/components/marketing/developer-section";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingFooter } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0F172A] font-sans antialiased selection:bg-[#1E5EFF] selection:text-white">
      {/* 1. Simplified Navigation Bar */}
      <MarketingNavbar />

      <main className="flex-1">
        {/* 2. Focused Hero Section with Realistic Recovery Console Mockup */}
        <HeroSection />

        {/* 3. Recovery Console Overview */}
        <ExecutiveOverviewSection />

        {/* 4. Multi-Agent Recovery Pipeline Architecture */}
        <ArchitectureSection />

        {/* 5. Modular Product Features Grid */}
        <BentoGrid />

        {/* 6. Feature Deep-Dives */}
        <FeatureDeepDives />

        {/* 7. Developer-First Code Editor & API Sandbox */}
        <DeveloperSection />

        {/* 8. Conversion Call-To-Action */}
        <CtaBand />
      </main>

      {/* 9. Simplified 5-Column Footer */}
      <MarketingFooter />
    </div>
  );
}
