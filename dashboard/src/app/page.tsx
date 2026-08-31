import React from "react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { ExecutiveOverviewSection } from "@/components/marketing/executive-overview-section";
import { ArchitectureSection } from "@/components/marketing/architecture-section";
import { BentoGrid } from "@/components/marketing/bento-grid";
import { StatsBand } from "@/components/marketing/stats-band";
import { FeatureDeepDives } from "@/components/marketing/feature-deep-dives";
import { DeveloperSection } from "@/components/marketing/developer-section";
import { TestimonialCarousel } from "@/components/marketing/testimonial-carousel";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingFooter } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0F172A] font-sans antialiased selection:bg-[#1E5EFF] selection:text-white">
      {/* 1. Sticky Navigation Bar with Mega-Menu */}
      <MarketingNavbar />

      <main className="flex-1">
        {/* 2. Hero Section with Live Mockup & Lead Capture */}
        <HeroSection />

        {/* 3. Infinite Grayscale Client Logo Marquee */}
        <LogoMarquee />

        {/* 4. Executive Console / Overview Section */}
        <ExecutiveOverviewSection />

        {/* 5. Multi-Agent Recovery Pipeline Architecture */}
        <ArchitectureSection />

        {/* 5. Modular Bento Product Grid */}
        <BentoGrid />

        {/* 5. High-Impact Dark Navy Stats & Trust Band */}
        <StatsBand />

        {/* 6. Feature Deep-Dives (Alternating Left/Right) */}
        <FeatureDeepDives />

        {/* 7. Developer-First Code Editor & API Sandbox */}
        <DeveloperSection />

        {/* 8. Enterprise Founder Testimonials Carousel */}
        <TestimonialCarousel />

        {/* 9. High-Conversion Gradient CTA Band */}
        <CtaBand />
      </main>

      {/* 10. Comprehensive Enterprise Footer */}
      <MarketingFooter />
    </div>
  );
}
