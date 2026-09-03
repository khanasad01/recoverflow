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

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] antialiased">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Slide-Over Drawer with Scrim */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0A2540] z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto animate-in fade-in duration-200">
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
