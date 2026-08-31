"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  KeyRound,
  Globe,
  Copy,
  Check,
  RefreshCw,
  Send,
  UserPlus,
  Users,
  AlertTriangle,
  X,
} from "lucide-react";
import { fetcher, SettingsData } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { useShell } from "@/components/layout/shell-context";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "admin" | "support" | "analyst";
  status: "ACTIVE" | "INVITED";
}

const INITIAL_USERS: UserRecord[] = [
  { id: "usr_01", name: "Anand Verma", email: "admin@recoverflow.dev", role: "admin", status: "ACTIVE" },
  { id: "usr_02", name: "Priya Sharma", email: "support@recoverflow.dev", role: "support", status: "ACTIVE" },
  { id: "usr_03", name: "Rohan Patel", email: "analyst@company.com", role: "analyst", status: "ACTIVE" },
];

export default function SettingsPage() {
  const { data: settings } = useSWR<SettingsData>("/api/v1/settings", fetcher);
  const { environment, setEnvironment } = useShell();

  const [copiedRzp, setCopiedRzp] = useState<boolean>(false);
  const [copiedStripe, setCopiedStripe] = useState<boolean>(false);
  const [copiedApiKey, setCopiedApiKey] = useState<boolean>(false);
  const [showRegenModal, setShowRegenModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("sk_live_99214a88f01b2901ce");
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);

  // Invite user form
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "support" | "analyst">("support");
  const [userList, setUserList] = useState<UserRecord[]>(INITIAL_USERS);

  const copyRzpWebhook = () => {
    const url = settings?.webhook_url || "http://localhost:8000/webhooks/razorpay";
    navigator.clipboard.writeText(url);
    setCopiedRzp(true);
    toast.success("Razorpay Webhook URL copied to clipboard!");
    setTimeout(() => setCopiedRzp(false), 2000);
  };

  const copyStripeWebhook = () => {
    const url = "http://localhost:8000/webhooks/stripe";
    navigator.clipboard.writeText(url);
    setCopiedStripe(true);
    toast.success("Stripe Webhook URL copied to clipboard!");
    setTimeout(() => setCopiedStripe(false), 2000);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    toast.success("API Secret Key copied to clipboard!");
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 8)}`;
    setApiKey(newKey);
    setShowRegenModal(false);
    toast.success("New production API Key generated! Previous key revoked.");
  };

  const handleSendTestWebhook = () => {
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      toast.success("Simulated payment.failed webhook delivered! HTTP 200 OK received.");
    }, 1200);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newUser: UserRecord = {
      id: `usr_${Date.now().toString().slice(-4)}`,
      name: inviteName || inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "INVITED",
    };
    setUserList([...userList, newUser]);
    setShowInviteModal(false);
    setInviteName("");
    setInviteEmail("");
    toast.success(`Invitation email sent to ${newUser.email}!`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            System &amp; Integration Settings
          </h2>
          <p className="text-xs text-[#5B6B84] mt-1">
            Payment gateway webhook endpoints, masked credentials, environment topology, and team permissions.
          </p>
        </div>

        {/* SECTION 1: High-Stakes Environment Segmented Control */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Active Execution Environment</h3>
              <p className="text-xs text-[#5B6B84] mt-0.5">
                Controls gateway routing endpoints and live payment instrument authorization.
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                environment === "live"
                  ? "bg-[#00C48C]/10 text-[#008760] border border-[#00C48C]/30"
                  : "bg-[#F59E0B]/10 text-[#B45309] border border-[#F59E0B]/30"
              }`}
            >
              {environment === "live" ? "Live Production" : "Test Sandbox"}
            </span>
          </div>

          {/* Segmented Control */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl max-w-md">
            <button
              onClick={() => {
                setEnvironment("live");
                toast.success("Switched to Live Production mode.");
              }}
              className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
                environment === "live"
                  ? "bg-white text-[#008760] shadow-sm font-bold border border-[#E5E9F0]"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              ● Live Production
            </button>
            <button
              onClick={() => {
                setEnvironment("test");
                toast.info("Switched to Test Sandbox mode (simulated payments only).");
              }}
              className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
                environment === "test"
                  ? "bg-white text-[#B45309] shadow-sm font-bold border border-[#E5E9F0]"
                  : "text-[#5B6B84] hover:text-[#0F172A]"
              }`}
            >
              ○ Test Sandbox Mode
            </button>
          </div>
        </div>

        {/* SECTION 2: API Keys & Credentials */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#1E5EFF]" />
              <h3 className="text-sm font-bold text-[#0F172A]">API Secret Keys</h3>
            </div>
            <button
              onClick={() => setShowRegenModal(true)}
              className="text-xs text-[#EF4444] hover:underline font-semibold cursor-pointer"
            >
              Regenerate Key...
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A]">
                {environment === "live" ? "Live Secret Key" : "Test Secret Key"}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-11 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg font-mono text-xs text-[#0F172A] flex items-center justify-between">
                  <span>{apiKey.slice(0, 10)}••••••••••••{apiKey.slice(-4)}</span>
                  <span className="text-[10px] text-[#5B6B84] uppercase font-bold">HMAC SHA-256</span>
                </div>
                <button
                  onClick={copyApiKey}
                  className="h-11 px-4 rounded-lg border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedApiKey ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5 text-[#5B6B84]" />}
                  <span>{copiedApiKey ? "Copied" : "Copy Key"}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#5B6B84]">
                Authenticate all SDK mutations and manual webhook invocations. Never expose in client-side code.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Gateway Webhook Ingestion Hub */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#1E5EFF]" />
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Webhook Ingestion Endpoints</h3>
                <p className="text-xs text-[#5B6B84]">Configured in your Razorpay &amp; Stripe developer dashboards</p>
              </div>
            </div>
            <button
              onClick={handleSendTestWebhook}
              disabled={testingWebhook}
              className="btn-pill-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {testingWebhook ? (
                <RefreshCw className="w-3 h-3 text-[#1E5EFF] animate-spin" />
              ) : (
                <Send className="w-3 h-3 text-[#1E5EFF]" />
              )}
              <span>Send Test Event</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Razorpay endpoint */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#0F172A]">Razorpay Webhook URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings?.webhook_url || "http://localhost:8000/webhooks/razorpay"}
                  className="flex-1 h-10 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg font-mono text-xs text-[#0F172A]"
                />
                <button
                  onClick={copyRzpWebhook}
                  className="h-10 px-3.5 rounded-lg border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5"
                >
                  {copiedRzp ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5 text-[#5B6B84]" />}
                  <span>{copiedRzp ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Stripe endpoint */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#0F172A]">Stripe Webhook URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="http://localhost:8000/webhooks/stripe"
                  className="flex-1 h-10 px-3 bg-[#F8F9FC] border border-[#E5E9F0] rounded-lg font-mono text-xs text-[#0F172A]"
                />
                <button
                  onClick={copyStripeWebhook}
                  className="h-10 px-3.5 rounded-lg border border-[#E5E9F0] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5"
                >
                  {copiedStripe ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5 text-[#5B6B84]" />}
                  <span>{copiedStripe ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Team & User Management (Admin only) */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1E5EFF]" />
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Team &amp; Role Governance</h3>
                <p className="text-xs text-[#5B6B84]">Manage console access, compliance review authorization, and audit logs</p>
              </div>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-pill-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fintech text-left">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Work Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold text-[#0F172A]">{u.name}</td>
                    <td className="font-mono text-xs text-[#5B6B84]">{u.email}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : u.role === "support"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={u.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REGENERATE CONFIRM MODAL */}
        {showRegenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowRegenModal(false)}
            />
            <div className="relative bg-white rounded-2xl border border-[#E5E9F0] shadow-2xl max-w-sm w-full p-6 z-10 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-[#EF4444]">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Regenerate API Key?</h4>
                  <p className="text-xs text-[#5B6B84]">This action is irreversible.</p>
                </div>
              </div>
              <p className="text-xs text-[#5B6B84] leading-relaxed">
                Existing production applications utilizing this key will immediately receive 401 Unauthorized until reconfigured.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRegenModal(false)}
                  className="btn-pill-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateKey}
                  className="px-4 py-2 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm &amp; Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INVITE USER MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="relative bg-white rounded-2xl border border-[#E5E9F0] shadow-2xl max-w-md w-full p-6 z-10 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#1E5EFF]" />
                  <h4 className="text-sm font-bold text-[#0F172A]">Invite Team Member</h4>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-lg text-[#5B6B84] hover:text-[#0F172A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInviteUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F172A]">Full Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="input-fintech"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F172A]">Corporate Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. vikram@company.com"
                    required
                    className="input-fintech"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F172A]">Access Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "support" | "analyst")}
                    className="w-full h-12 px-3 text-xs bg-white border border-[#E5E9F0] rounded-lg text-[#0F172A] focus:border-[#1E5EFF]"
                  >
                    <option value="support">Support Operator (Manual Overrides &amp; Link generation)</option>
                    <option value="analyst">Financial Analyst (Read-Only Analytics &amp; Reports)</option>
                    <option value="admin">Administrator (Full Access &amp; Policy Deployment)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="btn-pill-secondary px-4 py-2 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-pill-primary px-5 py-2 text-xs font-semibold"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
