"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Zap,
  LogOut,
  LayoutDashboard,
  Sliders,
} from "lucide-react";
import { loginUser } from "@/lib/api";
import { setToken, setUser, isAuthenticated, getUser, logout, AuthUser } from "@/lib/auth";
import { toast } from "sonner";

type OnboardingStep = "auth" | "connect" | "workspace" | "guardrails";
type AutonomyLevel = "suggest" | "approval" | "autonomous";

function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("auth");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const draftEmail = useSyncExternalStore(
    subscribeAuth,
    () => {
      try {
        return sessionStorage.getItem("rf_login_draft_email") || "";
      } catch {
        return "";
      }
    },
    () => ""
  );

  const [email, setEmail] = useState<string>(draftEmail);
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [connectedAccount, setConnectedAccount] = useState<string>("rzp_live_94829103");
  const [businessName, setBusinessName] = useState<string>("Acme Technologies Pvt Ltd");
  const [teamSize, setTeamSize] = useState<string>("11-50");
  const [useCase, setUseCase] = useState<"churn" | "recovery" | "both">("both");
  const [teammateEmail, setTeammateEmail] = useState<string>("");
  const [teammates, setTeammates] = useState<string[]>(["cfo@acmetech.io"]);
  const [retryThreshold, setRetryThreshold] = useState<number>(5000);
  const [escalationCeiling, setEscalationCeiling] = useState<number>(50000);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("approval");

  const isAuth = useSyncExternalStore(
    subscribeAuth,
    () => isAuthenticated(),
    () => false
  );

  const currentUser: AuthUser | null = useSyncExternalStore(
    subscribeAuth,
    () => getUser(),
    () => null
  );

  const updateDraftEmail = (val: string) => {
    setEmail(val);
    try {
      sessionStorage.setItem("rf_login_draft_email", val);
    } catch {}
  };

  const autofillDemo = (role: "admin" | "support") => {
    if (role === "admin") {
      updateDraftEmail("admin@recoverflow.dev");
      setPassword("admin123");
      toast.info("Auto-filled Admin credentials");
    } else {
      updateDraftEmail("support@recoverflow.dev");
      setPassword("support123");
      toast.info("Auto-filled Support credentials");
    }
    setEmailError("");
    setPasswordError("");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
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

      if (authMode === "signup") {
        setStep("connect");
      } else {
        toast.success("Welcome back! Redirecting to Executive Console...");
        router.replace("/overview");
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || "Invalid credentials.";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithRazorpay = () => {
    updateDraftEmail("merchant@company.com");
    setPassword("secure123");
    setStep("connect");
  };

  const handleAuthorizeRazorpay = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      setConnectedAccount("rzp_live_merch_8839201");
      toast.success("Razorpay account authorized successfully!");
      setStep("workspace");
    }, 800);
  };

  const handleAddTeammate = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && teammateEmail.includes("@")) {
      e.preventDefault();
      if (!teammates.includes(teammateEmail)) {
        setTeammates([...teammates, teammateEmail]);
      }
      setTeammateEmail("");
    }
  };

  const removeTeammate = (item: string) => {
    setTeammates(teammates.filter((t) => t !== item));
  };

  const handleActivatePlatform = () => {
    setLoading(true);
    if (!isAuthenticated()) {
      setToken("mock_jwt_token_merchant");
      setUser({
        id: "usr_onboarded",
        email: email || "admin@recoverflow.dev",
        full_name: businessName || "Finance Administrator",
        role: "admin",
        is_active: true,
      });
    }

    try {
      sessionStorage.removeItem("rf_login_draft_email");
    } catch {}

    toast.success("RecoverFlow successfully activated! Redirecting to Executive Console...");
    setTimeout(() => {
      router.replace("/overview");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFFFF] antialiased selection:bg-[#1E5EFF] selection:text-white relative overflow-hidden py-10 px-4 sm:px-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[540px] bg-gradient-to-tr from-[#1E5EFF]/08 via-[#635BFF]/06 to-[#7B61FF]/05 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-[520px] mx-auto w-full flex items-center justify-between pb-6">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 group cursor-pointer text-left"
          title="Return to Homepage"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E5EFF] via-[#3395FF] to-[#635BFF] p-[1px] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <div className="w-full h-full bg-[#0A2540] rounded-[11px] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 4C5 3.44772 5.44772 3 6 3H14C17.3137 3 20 5.68629 20 9C20 11.8344 18.0326 14.2096 15.3676 14.8396L19.4142 20.4206C19.8273 21.0028 19.3905 21.8 18.6657 21.8H14.8C14.3644 21.8 13.9592 21.5647 13.7431 21.1848L9.5 13.5H8V21C8 21.5523 7.55228 22 7 22H5.5C4.94772 22 4.5 21.5523 4.5 21V4H5ZM8 6.5V11H13.5C14.8807 11 16 9.88071 16 8.5C16 7.11929 14.8807 6.5 13.5 6.5H8Z" />
                <circle cx="17" cy="5.5" r="2" fill="#00D4FF" />
              </svg>
            </div>
          </div>
          <span className="text-base font-bold tracking-tight text-[#0A2540] flex items-center gap-1">
            Recover<span className="text-[#1E5EFF]">Flow</span>
          </span>
        </button>

        {step !== "auth" && !isAuth && (
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#5B6B84]">
            <span className="hidden sm:inline">
              Step {step === "connect" ? "1" : step === "workspace" ? "2" : "3"} of 3
            </span>
            <span className="sm:hidden">
              {step === "connect" ? "1/3" : step === "workspace" ? "2/3" : "3/3"}
            </span>
            <div className="flex items-center gap-1 ml-1.5">
              <span className={`w-2 h-2 rounded-full ${step === "connect" ? "bg-[#1E5EFF]" : "bg-[#00C48C]"}`} />
              <span className={`w-2 h-2 rounded-full ${step === "workspace" ? "bg-[#1E5EFF]" : step === "guardrails" ? "bg-[#00C48C]" : "bg-[#E5E9F0]"}`} />
              <span className={`w-2 h-2 rounded-full ${step === "guardrails" ? "bg-[#1E5EFF]" : "bg-[#E5E9F0]"}`} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {isAuth && step === "auth" ? (
          <div className="w-full max-w-[440px] bg-white border border-[#E5E9F0] rounded-2xl shadow-[0_20px_40px_rgba(10,37,64,0.06)] p-6 sm:p-8 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8F0FF] text-[#1E5EFF] flex items-center justify-center mx-auto">
              <LayoutDashboard className="w-6 h-6 stroke-[1.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#0F172A]">Active Session Detected</h3>
              <p className="text-xs text-[#5B6B84]">
                You are authenticated as <strong className="text-[#0F172A]">{currentUser?.email || "admin@recoverflow.dev"}</strong>.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => router.replace("/overview")}
                className="btn-pill-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Executive Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setStep("connect")}
                className="btn-pill-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Reconfigure Razorpay Guardrails</span>
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  logout();
                  toast.info("Logged out successfully.");
                }}
                className="w-full py-2 text-xs text-[#EF4444] hover:underline flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign in as a different user</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {step === "auth" && (
              <div className="w-full max-w-[440px] bg-white border border-[#E5E9F0] rounded-2xl shadow-[0_20px_40px_rgba(10,37,64,0.06)] p-6 sm:p-8 space-y-6 text-left animate-in fade-in duration-200">
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl sm:text-[28px] font-bold text-[#1A1A2E] tracking-tight leading-tight">
                    {authMode === "signin" ? "Welcome back" : "Set up your recovery workspace"}
                  </h2>
                  <p className="text-sm text-[#5A5A72]">
                    {authMode === "signin"
                      ? "Sign in to manage your revenue recovery."
                      : "Start recovering revenue in under 3 minutes."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleContinueWithRazorpay}
                  className="w-full h-12 rounded-full border-2 border-[#1E5EFF] bg-[#1E5EFF]/5 hover:bg-[#1E5EFF]/10 text-[#0A2540] text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-md bg-[#0C2340] text-white flex items-center justify-center font-bold text-[11px]">
                    R
                  </div>
                  <span>Continue with Razorpay</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#E5E9F0] w-full" />
                  <span className="bg-white px-3 text-xs font-medium text-[#5B6B84]">
                    or continue with email
                  </span>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0A2540]" htmlFor="auth-email">
                      Work Email
                    </label>
                    <input
                      type="email"
                      id="auth-email"
                      value={email}
                      onChange={(e) => {
                        updateDraftEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="alex@company.com"
                      className="w-full h-12 px-4 rounded-lg border border-[#E5E9F0] focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20 outline-none text-sm text-[#0F172A] placeholder-[#5B6B84]"
                    />
                    {emailError && (
                      <p className="text-xs text-[#EF4444] pt-0.5">{emailError}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#0A2540]" htmlFor="auth-password">
                        Password
                      </label>
                      {authMode === "signin" && (
                        <button
                          type="button"
                          onClick={() => toast.info("Password reset instructions dispatched to your email.")}
                          className="text-xs text-[#1E5EFF] hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      id="auth-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="••••••••"
                      className="w-full h-12 px-4 rounded-lg border border-[#E5E9F0] focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20 outline-none text-sm text-[#0F172A] placeholder-[#5B6B84]"
                    />
                    {passwordError && (
                      <p className="text-xs text-[#EF4444] pt-0.5">{passwordError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => autofillDemo("admin")}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] bg-[#F8F9FC] text-[11px] font-semibold text-[#0A2540] transition-colors"
                    >
                      Try as Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => autofillDemo("support")}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-[#E5E9F0] hover:border-[#1E5EFF] bg-[#F8F9FC] text-[11px] font-semibold text-[#0A2540] transition-colors"
                    >
                      Try as Support
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-full bg-gradient-to-r from-[#1E5EFF] to-[#7B61FF] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
                  >
                    <span>{loading ? "Authenticating..." : "Continue"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center pt-1 border-t border-[#E5E9F0]">
                  {authMode === "signin" ? (
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-xs text-[#5B6B84] hover:text-[#1E5EFF] transition-colors cursor-pointer"
                    >
                      New to RecoverFlow? <strong className="text-[#1E5EFF]">Create an account →</strong>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-xs text-[#5B6B84] hover:text-[#1E5EFF] transition-colors cursor-pointer"
                    >
                      Already have an account? <strong className="text-[#1E5EFF]">Sign in →</strong>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-[#5B6B84] pt-1">
                  <Lock className="w-3 h-3 text-[#00C48C]" />
                  <span>Bank-grade encryption · SOC 2 Type II Certified</span>
                </div>
              </div>
            )}

            {step === "connect" && (
              <div className="w-full max-w-[520px] bg-white border border-[#E5E9F0] rounded-2xl shadow-[0_20px_40px_rgba(10,37,64,0.06)] p-6 sm:p-8 space-y-6 text-left animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E5E9F0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0C2340] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      R
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A2540]">Razorpay</div>
                      <div className="text-[10px] text-[#5B6B84] font-mono">{connectedAccount}</div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-3 relative">
                    <div className="w-full border-t-2 border-dashed border-[#1E5EFF]/40" />
                    <div className="absolute w-6 h-6 rounded-full bg-white border border-[#E5E9F0] shadow-xs flex items-center justify-center text-[#1E5EFF]">
                      <Lock className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0A2540] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-[#1D3152]">
                      RF
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A2540]">RecoverFlow</div>
                      <div className="text-[10px] text-[#008760] font-mono font-semibold">AI Engine</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                    Connect your Razorpay account
                  </h2>
                  <p className="text-sm text-[#5B6B84] leading-relaxed">
                    RecoverFlow reads your payment events in real time. <strong className="text-[#0A2540]">We never move money — only Razorpay does.</strong>
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-[#F8F9FC] border border-[#E5E9F0] text-xs">
                  <div className="flex items-center gap-2 text-[#008760] font-medium">
                    <Check className="w-4 h-4 text-[#00C48C] flex-shrink-0 stroke-[2]" />
                    <span>Read payment and payout failure events via verified webhooks</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#008760] font-medium">
                    <Check className="w-4 h-4 text-[#00C48C] flex-shrink-0 stroke-[2]" />
                    <span>Generate dynamic alternative payment links and smart retries</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5B6B84] font-medium pt-1 border-t border-[#E5E9F0]">
                    <X className="w-4 h-4 text-[#A0AEC0] flex-shrink-0 stroke-[2]" />
                    <span className="line-through text-[#A0AEC0]">Cannot initiate direct bank withdrawals or unapproved refunds</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleAuthorizeRazorpay}
                    disabled={isAuthorizing}
                    className="w-full h-12 rounded-full bg-[#0C2340] hover:bg-[#072654] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                  >
                    <span>{isAuthorizing ? "Connecting to Razorpay..." : "Authorize with Razorpay"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      onClick={() => {
                        toast.info("Continuing in limited Sandbox Demo mode.");
                        setStep("workspace");
                      }}
                      className="text-xs text-[#5B6B84] hover:text-[#1E5EFF] transition-colors cursor-pointer"
                    >
                      I&apos;ll do this later (Open Sandbox Mode) →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "workspace" && (
              <div className="w-full max-w-[520px] bg-white border border-[#E5E9F0] rounded-2xl shadow-[0_20px_40px_rgba(10,37,64,0.06)] p-6 sm:p-8 space-y-6 text-left animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                    Set up your workspace
                  </h2>
                  <p className="text-sm text-[#5A5A72]">
                    Calibrate recovery algorithms to your digital transaction model.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0A2540]">
                      Registered Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg border border-[#E5E9F0] focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20 outline-none text-sm text-[#0F172A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0A2540]">
                      Company Size
                    </label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full h-12 px-4 rounded-lg border border-[#E5E9F0] focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20 outline-none text-sm text-[#0F172A] bg-white cursor-pointer"
                    >
                      <option value="1-10">1–10 employees (Early Stage)</option>
                      <option value="11-50">11–50 employees (Growth SaaS / Commerce)</option>
                      <option value="51-200">51–200 employees (Scale-up)</option>
                      <option value="200+">200+ employees (Enterprise)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0A2540]">
                      Primary Recovery Goal
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setUseCase("churn")}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          useCase === "churn"
                            ? "bg-[#1E5EFF]/08 border-[#1E5EFF] text-[#1E5EFF] font-bold"
                            : "bg-[#F8F9FC] border-[#E5E9F0] text-[#5B6B84]"
                        }`}
                      >
                        <span className="text-xs block">Reduce Churn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUseCase("recovery")}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          useCase === "recovery"
                            ? "bg-[#1E5EFF]/08 border-[#1E5EFF] text-[#1E5EFF] font-bold"
                            : "bg-[#F8F9FC] border-[#E5E9F0] text-[#5B6B84]"
                        }`}
                      >
                        <span className="text-xs block">Recover Failures</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUseCase("both")}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          useCase === "both"
                            ? "bg-[#1E5EFF]/08 border-[#1E5EFF] text-[#1E5EFF] font-bold"
                            : "bg-[#F8F9FC] border-[#E5E9F0] text-[#5B6B84]"
                        }`}
                      >
                        <span className="text-xs block">Both (Optimal)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0A2540] flex items-center justify-between">
                      <span>Invite Finance Teammates (Optional)</span>
                      <span className="text-[10px] text-[#5B6B84]">Press Enter</span>
                    </label>
                    <input
                      type="email"
                      value={teammateEmail}
                      onChange={(e) => setTeammateEmail(e.target.value)}
                      onKeyDown={handleAddTeammate}
                      placeholder="colleague@company.com"
                      className="w-full h-11 px-4 rounded-lg border border-[#E5E9F0] focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20 outline-none text-xs text-[#0F172A]"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {teammates.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F4F9] border border-[#E5E9F0] text-xs text-[#0A2540]"
                        >
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => removeTeammate(t)}
                            className="text-[#5B6B84] hover:text-[#EF4444]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E9F0]">
                  <button
                    type="button"
                    onClick={() => setStep("connect")}
                    className="text-xs font-semibold text-[#5B6B84] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("guardrails")}
                      className="text-xs text-[#5B6B84] hover:text-[#1E5EFF] cursor-pointer"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("guardrails")}
                      className="btn-pill-primary h-11 px-6 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "guardrails" && (
              <div className="w-full max-w-[640px] bg-white border border-[#E5E9F0] rounded-2xl shadow-[0_20px_40px_rgba(10,37,64,0.06)] p-6 sm:p-8 space-y-6 text-left animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#7B61FF] uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Step 3 of 3: Policy Configuration</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                    Set your recovery guardrails
                  </h2>
                  <p className="text-sm text-[#5A5A72]">
                    Define how much autonomy AI agents have before they require CFO or operator review.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[#E5E9F0] bg-[#F8F9FC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0A2540]">Auto-retry Threshold</span>
                      <span className="font-mono font-bold text-[#1E5EFF] text-sm tabular-nums">
                        ₹{retryThreshold.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={25000}
                      step={1000}
                      value={retryThreshold}
                      onChange={(e) => setRetryThreshold(Number(e.target.value))}
                      className="w-full accent-[#1E5EFF] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#5B6B84]">
                      Transactions below ₹{retryThreshold.toLocaleString()} will retry automatically on optimal bank rails without disturbing the user.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E5E9F0] bg-[#F8F9FC] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0A2540]">Human Review Escalation Ceiling</span>
                      <span className="font-mono font-semibold text-[#008760] text-xs">Hard Gate</span>
                    </div>
                    <select
                      value={escalationCeiling}
                      onChange={(e) => setEscalationCeiling(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E5E9F0] bg-white text-xs font-semibold text-[#0A2540] outline-none"
                    >
                      <option value={25000}>Escalate to human review above ₹25,000</option>
                      <option value={50000}>Escalate to human review above ₹50,000 (Recommended)</option>
                      <option value={100000}>Escalate to human review above ₹1,00,000</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E5E9F0] bg-[#F8F9FC] space-y-2