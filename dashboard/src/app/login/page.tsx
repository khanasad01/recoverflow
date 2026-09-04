"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { getToken, setToken, setUser } from "@/lib/auth";
import { toast } from "sonner";
import { RecoverFlowLogo } from "@/components/brand/logo";

type AuthMethod = "email" | "google" | "email_otp" | "whatsapp";

export default function LoginPage() {
  const router = useRouter();

  // Lazy state initializers
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("rf_login_draft_email") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  
  // OTP states
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("rf_login_draft_email", email);
      } catch {}
    }
  }, [email]);
  
  // Check auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (getToken()) {
        router.replace("/overview");
      }
    }
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    
    let valid = true;
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid work email address");
      valid = false;
    }
    if (!password || password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const data = await loginUser(email, password);
      setToken(data.access_token);
      setUser(data.user);
      toast.success("Welcome back! Redirecting...");
      router.replace("/overview");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Invalid credentials.";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === "email_otp" && (!email || !email.includes("@"))) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (authMethod === "whatsapp" && !phone) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      toast.success("OTP sent successfully! (Simulated)");
    }, 1000);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("OTP verified successfully! (Simulated)");
      router.replace("/overview");
    }, 1000);
  };

  const renderForm = () => {
    switch (authMethod) {
      case "email":
        return (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]" htmlFor="email">
                Work Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="alex@company.com"
                className="input-fintech w-full"
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="••••••••"
                className="input-fintech w-full"
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary w-full mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        );

      case "google":
        return (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => toast.error("Google OAuth not configured")}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#E5E9F0] rounded-lg text-sm font-medium text-[#0F172A] hover:bg-[#F8F9FC] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        );

      case "email_otp":
        return otpSent ? (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Enter OTP sent to Email</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="input-fintech w-full text-center tracking-[0.5em]"
                maxLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-pill-primary w-full">
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="input-fintech w-full"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-pill-primary w-full">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        );

      case "whatsapp":
        return otpSent ? (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Enter OTP sent via WhatsApp</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="input-fintech w-full text-center tracking-[0.5em]"
                maxLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-pill-primary w-full">
              {loading ? "Verifying..." : "Verify & Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="input-fintech w-full"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-pill-primary w-full">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white border border-[#E5E9F0] rounded-xl shadow-[0_20px_40px_rgba(10,37,64,0.06)] p-8">
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <RecoverFlowLogo size="lg" theme="light" />
          </div>
          <h2 className="text-xl font-semibold text-[#0F172A]">Sign in to your account</h2>
        </div>

        {/* Auth Tabs */}
        <div className="flex p-1 mb-6 bg-[#F8F9FC] rounded-lg border border-[#E5E9F0]">
          {(["email", "google", "email_otp", "whatsapp"] as const).map((method) => (
            <button
              key={method}
              onClick={() => {
                setAuthMethod(method);
                setOtpSent(false);
                setOtp("");
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                authMethod === method
                  ? "bg-white text-[#0F172A] shadow-sm"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              {method === "email" && "Email"}
              {method === "google" && "Google"}
              {method === "email_otp" && "Email OTP"}
              {method === "whatsapp" && "WhatsApp"}
            </button>
          ))}
        </div>

        {renderForm()}

        <div className="mt-8 text-center">
          <p className="text-sm text-[#5B6B84]">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-[#1E5EFF] hover:underline font-medium">
              Contact sales
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}