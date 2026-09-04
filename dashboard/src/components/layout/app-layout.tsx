"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ShellProvider, useShell } from "./shell-context";
import { isAuthenticated } from "@/lib/auth";
import { X } from "lucide-react";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobileDrawerOpen, setIsMobileDrawerOpen } = useShell();

  // Dismiss mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] antialiased">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1E5EFF] focus:text-white focus:rounded-lg focus:shadow-lg focus:font-semibold focus:text-xs focus-visible:outline-2 focus-visible:outline-white"
      >
        Skip to main content
      </a>

      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Slide-Over Drawer with Scrim */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0A2540] z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto outline-hidden animate-in fade-in duration-200"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <ShellProvider>
      <LayoutContent>{children}</LayoutContent>
    </ShellProvider>
  );
}
