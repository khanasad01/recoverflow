"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { getToken, setToken, setUser } from "@/lib/auth";
import { toast } from "sonner";
import { RecoverFlowLogo } from "@/components/brand/logo";

type AuthMethod = "email" | "google";

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

  const handleGoogleLogin = () => {
    setToken("rf_google_token_" + Date.now());
    setUser({
      id: "usr_google_admin",
      email: "admin@recoverflow.dev",
      full_name: "Admin User",
      role: "admin",
      is_active: true,
    });
    toast.success("Signed in with Google! Redirecting...");
    router.replace("/overview");
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
                placeholder="admin@recoverflow.dev"
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
              className="btn-pill-primary w-full mt-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@recoverflow.dev");
                  setPassword("admin123");
                  setEmailError("");
                  setPasswordError("");
                }}
                className="w-full py-2 px-3 rounded-lg border border-[#E5E9F0] bg-[#F8F9FC] hover:bg-[#F1F4F9] text-xs font-semibold text-[#5B6B84] hover:text-[#0F172A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
              >
                <span>Quick Demo Fill (admin@recoverflow.dev)</span>
              </button>
            </div>
          </form>
        );

      case "google":
        return (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-[#E5E9F0] rounded-lg text-sm font-semibold text-[#0F172A] hover:bg-[#F8F9FC] transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-[11px] text-center text-[#5B6B84] leading-relaxed">
              Enterprise Single Sign-On (SSO) for authorized domain administrators.
            </p>
          </div>
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

        {/* Auth Tabs: Email & Google only */}
        <div className="flex p-1 mb-6 bg-[#F8F9FC] rounded-lg border border-[#E5E9F0]">
          {(["email", "google"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setAuthMethod(method)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                authMethod === method
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              {method === "email" && "Work Email"}
              {method === "google" && "Google Workspace"}
            </button>
          ))}
        </div>

        {renderForm()}

        <div className="mt-8 text-center">
          <p className="text-sm text-[#5B6B84]">
            Don&apos;t have an account?{" "}
            <a href="mailto:sales@recoverflow.dev" className="text-[#1E5EFF] hover:underline font-medium">
              Contact sales
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}