import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  CreditCard,
  Activity,
} from "lucide-react";

export function FeatureDeepDives() {

  return (
    <div id="features" className="bg-[#F8F9FC] py-24 lg:py-32 space-y-28 lg:space-y-36">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-28 lg:space-y-36">
        {/* Feature 1: Left Text / Right Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs font-mono font-bold tracking-widest text-[#1E5EFF] uppercase">
              CHECKOUT CONVERSION SUITE
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A2540] tracking-tight leading-tight">
              Frictionless checkout experiences that maximize conversion.
            </h2>
            <p className="text-base sm:text-lg text-[#5B6B84] leading-relaxed">
              Eliminate payment drop-offs with adaptive UI, saved payment instruments, tokenized cards, and localized UPI flows engineered to boost capture rates by up to 4.2%.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">One-Click UPI Intent:</strong> Seamless handoff to PhonePe, Google Pay, and Paytm without switching screens.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Network Card Tokenization:</strong> Cryptographically tokenized card storage safeguarding card details while accelerating repeat checkout.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Dynamic Failure Fallback:</strong> If a bank rail slows down, alternative instruments are highlighted automatically.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="#developer"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1E5EFF] hover:text-[#1649D8] transition-colors"
              >
                <span>Learn more about Payment Gateway</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Realistic UI Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-[#E5E9F0] shadow-fintech overflow-hidden">
              {/* Mockup Top Header */}
              <div className="bg-[#0A2540] px-4 py-3 flex items-center justify-between border-b border-[#1D3152]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
                </div>
                <span className="text-[11px] font-mono text-slate-300">checkout.recoverflow.com/pay_v2</span>
                <span className="text-[10px] font-mono text-[#00C48C] font-semibold">256-Bit SSL</span>
              </div>

              {/* Mockup Body */}
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-4">
                  <div>
                    <span className="text-xs text-[#5B6B84] block">Merchant: FastDelivery Logistics</span>
                    <span className="text-xl font-bold font-mono text-[#0A2540]">₹2,499.00</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#00C48C]/10 text-[#00C48C] text-[11px] font-bold">
                    1-Click Enabled
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-[#0A2540]">Choose Payment Option</div>
                  
                  {/* Option 1: UPI Fast Track */}
                  <div className="p-3 rounded-xl border-2 border-[#1E5EFF] bg-[#1E5EFF]/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1E5EFF] text-white flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0A2540]">UPI Auto-Verification</div>
                        <div className="text-[11px] text-[#5B6B84]">Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                    </div>
                    <span className="w-4 h-4 rounded-full border-4 border-[#1E5EFF] bg-white" />
                  </div>

                  {/* Option 2: Saved Card */}
                  <div className="p-3 rounded-xl border border-[#E5E9F0] bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0A2540] flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0A2540]">HDFC Regalia Gold •••• 8812</div>
                        <div className="text-[11px] text-[#5B6B84]">Expires 08/29 • Tokenized</div>
                      </div>
                    </div>
                    <span className="w-4 h-4 rounded-full border border-slate-300" />
                  </div>
                </div>

                <div className="pt-2">
                  <button className="btn-pill-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹2,499.00 Securely</span>
                  </button>
                  <p className="text-[11px] text-center text-[#5B6B84] mt-2">
                    Protected by RecoverFlow Smart Shield & Token Vault
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Right Text / Left Mockup (Inverted) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Realistic UI Mockup */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-[#0A2540] text-white rounded-2xl border border-slate-800 shadow-fintech overflow-hidden">
              {/* Window Header */}
              <div className="bg-[#061224] px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C] animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    RecoverFlow™ Smart Routing Core
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#00D4FF]">Multi-Bank Latency Matrix</span>
              </div>

              {/* Visual Health Grid */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#0D2D52] border border-slate-700">
                    <span className="text-[11px] text-slate-400 font-mono">HDFC Gateway Rail</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-bold font-mono text-[#00C48C]">99.98%</span>
                      <span className="text-[10px] font-mono text-slate-300">118ms</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D2D52] border border-slate-700">
                    <span className="text-[11px] text-slate-400 font-mono">ICICI Direct Rail</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-bold font-mono text-[#00C48C]">99.94%</span>
                      <span className="text-[10px] font-mono text-slate-300">132ms</span>
                    </div>
                  </div>
                </div>

                {/* Intelligent Dynamic Failover Box */}
                <div className="p-4 rounded-xl bg-[#061224] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      Dynamic Fallback Triggered
                    </span>
                    <span className="text-[#00C48C] font-bold">Rescued in 14ms</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    Primary gateway latency spiked to &gt;800ms. Traffic rerouted autonomously to Axis Bank backup rail. Zero checkout drops recorded.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <span>Recovery Efficiency: <strong className="text-white">92.4%</strong></span>
                  <span className="text-[#00C48C]">Auto-reconciled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Text Description */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="text-xs font-mono font-bold tracking-widest text-[#1E5EFF] uppercase">
              AUTONOMOUS AI RETRY & SMART ROUTING
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A2540] tracking-tight leading-tight">
              Turn declined payments into captured revenue without user friction.
            </h2>
            <p className="text-base sm:text-lg text-[#5B6B84] leading-relaxed">
              Our proprietary machine-learning routing engine diagnoses gateway downtime in real time and automatically re-routes traffic across 12 banking partners and 6 payment rails before a decline ever registers.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Sub-20ms Rail Failover:</strong> Instantaneous algorithmic switching without customer intervention or page reloads.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Smart Card Retry Engine:</strong> Non-disruptive background retry cadence for soft card declines and bank network timeouts.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Incremental Revenue Lift:</strong> Provable revenue recovery backed by continuous A/B holdout testing.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1E5EFF] hover:text-[#1649D8] transition-colors"
              >
                <span>Explore Autonomous Recovery telemetry</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature 3: Left Text / Right Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs font-mono font-bold tracking-widest text-[#1E5EFF] uppercase">
              TREASURY & AUTOMATED RECONCILIATION
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A2540] tracking-tight leading-tight">
              Instant settlements and real-time ledger intelligence.
            </h2>
            <p className="text-base sm:text-lg text-[#5B6B84] leading-relaxed">
              Say goodbye to T+2 settlement lag. Access your funds on demand with T+0 instant settlements, multi-account routing, and automated two-way bank statement reconciliation.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">T+0 Instant Liquidity:</strong> Settle transactions in minutes, including weekends and national bank holidays.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Automated Invoice Reconciliation:</strong> Match UTR numbers and ERP accounting entries with 100% precision.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm text-[#0F172A]">
                  <strong className="text-[#0A2540]">Multi-Entity Treasury Management:</strong> Route inbound funds across subsidiaries and business units automatically.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1E5EFF] hover:text-[#1649D8] transition-colors"
              >
                <span>Discover Instant Settlements</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Realistic UI Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-[#E5E9F0] shadow-fintech p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9F0]">
                <div>
                  <div className="text-xs font-medium text-[#5B6B84]">Real-Time Liquidity Pool</div>
                  <div className="text-2xl font-bold font-mono text-[#0A2540]">₹1,84,30,900.00</div>
                </div>
                <div className="px-3 py-1 bg-[#00C48C]/10 text-[#00C48C] text-xs font-bold font-mono rounded-full">
                  Settlement Live
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#0A2540]">Recent Automated Settlements</div>
                <div className="p-3 bg-[#F8F9FC] rounded-xl border border-[#E5E9F0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#0A2540]">Settlement Batch #8812</span>
                    <span className="text-[11px] text-[#5B6B84] block font-mono">UTR: CMS99281726 • HDFC Corporate</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-[#00C48C]">+₹28,50,000</span>
                    <span className="text-[10px] text-[#5B6B84] block">Settled (0.8s)</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8F9FC] rounded-xl border border-[#E5E9F0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#0A2540]">Settlement Batch #8811</span>
                    <span className="text-[11px] text-[#5B6B84] block font-mono">UTR: CMS99281702 • ICICI Neo</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-[#00C48C]">+₹45,10,200</span>
                    <span className="text-[10px] text-[#5B6B84] block">Settled (1.2s)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#5B6B84] flex items-center justify-between border-t border-[#E5E9F0]">
                <span>Automated Ledger Sync: <strong className="text-[#0A2540]">100% Balanced</strong></span>
                <span className="text-[#1E5EFF] font-semibold">T+0 Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
