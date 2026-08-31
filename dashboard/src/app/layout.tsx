import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "RecoverFlow | Razorpay-Grade Payments & Autonomous Recovery Engine",
  description: "Enterprise payment gateway, autonomous failure recovery, 24/7 instant payouts, and banking infrastructure engineered for hyper-growth businesses.",
  keywords: ["payment gateway", "fintech", "payment recovery", "upi payments", "instant payouts", "smart routing", "razorpay"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full font-sans antialiased bg-[#FFFFFF] text-[#0F172A] selection:bg-[#1E5EFF] selection:text-white">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
