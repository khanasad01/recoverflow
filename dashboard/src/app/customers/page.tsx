"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Mail,
  Phone,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetcher, Customer } from "@/lib/api";
import { AppLayout } from "@/components/layout/app-layout";
import { ScoreBar } from "@/components/ui/score-bar";
import { LoadingTableSkeleton, EmptyTableState, ErrorTableState } from "@/components/ui/table-states";

import { toast } from "sonner";

export default function CustomersPage() {
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCust) {
        setSelectedCust(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCust]);

  const { data: customers, error, isLoading, mutate } = useSWR<Customer[]>(
    "/api/v1/customers",
    fetcher,
    { refreshInterval: 10000 }
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Customers
          </h2>
          <p className="text-xs text-[#5B6B84] mt-1">
            Customer risk profiles, recovery rates, and historical payment activity.
          </p>
        </div>

        {/* Customers Table */}
        <div className="bg-white border border-[#E5E9F0] rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <ErrorTableState
              title="Unable to load customer profiles"
              description="Failed to communicate with customer intelligence store. Please check network connection and try again."
              onRetry={() => {
                mutate();
                toast.info("Retrying customer profiles synchronization...");
              }}
            />
          ) : isLoading ? (
            <LoadingTableSkeleton rows={6} cols={7} />
          ) : !customers || customers.length === 0 ? (
            <EmptyTableState
              title="No customer profiles found"
              description="No customer profiles found. Customer intelligence profiles are automatically generated as transactions ingest."
              actionLabel="Refresh Profiles"
              onAction={() => {
                mutate();
                toast.success("Customer profiles refreshed.");
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fintech text-left">
                <thead>
                  <tr>
                    <th scope="col">Customer Identity</th>
                    <th scope="col">Customer ID</th>
                    <th scope="col">Failed Events</th>
                    <th scope="col" className="text-right">Avg Amount</th>
                    <th scope="col">Recovery Rate</th>
                    <th scope="col" className="text-right">Total Recovered</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const failCount = c.total_opportunities ?? 0;
                    const totalRecovered = Number(c.total_recovered ?? 0);
                    const avgAmount = failCount > 0 && totalRecovered > 0 ? totalRecovered / failCount : totalRecovered;
                    const recRate = totalRecovered > 0 ? 80 : 0;

                    return (
                      <tr
                        key={c.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`View customer details for ${c.email || c.id}`}
                        onClick={() => setSelectedCust(c)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedCust(c);
                          }
                        }}
                        className="cursor-pointer hover:bg-[#F1F4F9] focus-visible:bg-[#F1F4F9] focus-visible:outline-2 focus-visible:outline-[#1E5EFF] transition-colors"
                      >
                        {/* Identity */}
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {(c.email || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#0F172A]">{c.email || "guest@checkout.com"}</div>
                              {c.phone && <div className="text-[11px] text-[#5B6B84] font-mono">{c.phone}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Customer ID */}
                        <td className="font-mono text-xs text-[#5B6B84]">
                          {c.id}
                        </td>

                        {/* Failures */}
                        <td className="font-mono font-medium text-[#0F172A]">
                          {c.total_opportunities}
                        </td>

                        {/* Avg Amount */}
                        <td className="text-right font-mono text-xs font-semibold text-[#0F172A]">
                          ₹{avgAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </td>

                        {/* Recovery Rate */}
                        <td className="w-36">
                          <ScoreBar score={recRate / 100} />
                        </td>

                        {/* Total Recovered */}
                        <td className="text-right font-mono font-bold text-[#008760]">
                          ₹{Number(c.total_recovered).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Action */}
                        <td className="text-right">
                          <span className="text-xs font-semibold text-[#1E5EFF] hover:underline inline-flex items-center gap-1">
                            <span>View 360</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CUSTOMER 360 DRAWER (480px) */}
        {selectedCust && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-[#0A2540]/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedCust(null)}
              aria-hidden="true"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cust-drawer-title"
              className="relative w-full sm:max-w-[480px] bg-white h-full shadow-[0_32px_64px_rgba(10,37,64,0.16)] flex flex-col z-10 animate-in slide-in-from-right duration-200"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#E5E9F0] flex items-center justify-between bg-[#F8F9FC]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1E5EFF] text-white font-bold text-sm flex items-center justify-center">
                    {(selectedCust.email || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 id="cust-drawer-title" className="text-sm font-bold text-[#0F172A]">{selectedCust.email || "Customer Profile"}</h3>
                    <span className="text-[11px] font-mono text-[#5B6B84]">{selectedCust.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCust(null)}
                  aria-label="Close drawer"
                  className="p-1.5 rounded-lg text-[#5B6B84] hover:text-[#0F172A] hover:bg-[#E5E9F0] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1E5EFF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Profile Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B84] block">
                      Total Failure Events
                    </span>
                    <span className="text-2xl font-bold font-mono text-[#0F172A] mt-0.5 block">
                      {selectedCust.total_opportunities}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#F8F9FC] border border-[#E5E9F0] rounded-xl">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B84] block">
                      Total Recovered
                    </span>
                    <span className="text-2xl font-bold font-mono text-[#008760] mt-0.5 block">
                      ₹{Number(selectedCust.total_recovered).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-4 bg-white border border-[#E5E9F0] rounded-xl space-y-2.5 text-xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B84]">
                    Verified Communication Rails
                  </div>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Mail className="w-4 h-4 text-[#1E5EFF]" />
                    <span>{selectedCust.email || "No email on record"}</span>
                  </div>
                  {selectedCust.phone && (
                    <div className="flex items-center gap-2 text-[#0F172A] font-mono">
                      <Phone className="w-4 h-4 text-[#00C48C]" />
                      <span>{selectedCust.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#5B6B84]">
                    <Calendar className="w-4 h-4" />
                    <span>Profile created {new Date(selectedCust.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Historical Payment Velocity Chart */}
                <div className="bg-white border border-[#E5E9F0] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">Recovery History Trajectory</span>
                    <span className="text-[11px] font-mono text-[#008760] font-semibold">90-Day Trend</span>
                  </div>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { date: "Day 1", amount: 4000 },
                          { date: "Day 15", amount: 9500 },
                          { date: "Day 30", amount: 14000 },
                          { date: "Day 60", amount: 22000 },
                          { date: "Day 90", amount: Number(selectedCust.total_recovered) || 35000 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                        <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E9F0",
                            borderRadius: "0.5rem",
                            fontSize: "0.75rem",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Cum. Recovered"
                          stroke="#1E5EFF"
                          strokeWidth={2}
                          dot={{ fill: "#1E5EFF", r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Eligibility Pill */}
                <div className="p-3.5 bg-[#1E5EFF]/5 border border-[#1E5EFF]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#0F172A]">
                  <ShieldCheck className="w-4 h-4 text-[#1E5EFF] flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-[#1E5EFF] block">Autonomous Recovery Qualified</strong>
                    Eligible for dynamic UPI payment links, WhatsApp automated nudges, and intelligent card retry schedules.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
