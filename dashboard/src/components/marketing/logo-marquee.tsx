"use client";

import React from "react";

const CLIENTS = [
  { name: "ZEPTO", label: "Zepto" },
  { name: "SWIGGY", label: "Swiggy" },
  { name: "ZOMATO", label: "Zomato" },
  { name: "CRED", label: "CRED" },
  { name: "ZERODHA", label: "Zerodha" },
  { name: "NYKAA", label: "Nykaa" },
  { name: "BOOKMYSHOW", label: "BookMyShow" },
  { name: "MEESHO", label: "Meesho" },
  { name: "URBAN COMPANY", label: "Urban Company" },
  { name: "AIRBNB", label: "Airbnb" },
];

export function LogoMarquee() {
  return (
    <div className="w-full bg-[#F8F9FC] border-y border-[#E5E9F0] py-8 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-4 text-center">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#5B6B84]">
          Powering payment experiences for market leaders
        </p>
      </div>

      <div className="relative w-full overflow-hidden flex items-center">
        {/* Gradient edge masks for smooth fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#F8F9FC] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#F8F9FC] to-transparent z-10 pointer-events-none" />

        {/* Marquee Track */}
        <div className="animate-marquee flex items-center gap-12 sm:gap-16 whitespace-nowrap">
          {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-slate-400 hover:text-[#0A2540] transition-colors duration-200 cursor-default select-none group"
            >
              <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#1E5EFF] transition-colors" />
              <span className="text-base sm:text-lg font-bold tracking-tight font-sans">
                {client.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
