import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  theme?: "dark" | "light";
}

export function RecoverFlowLogo({
  size = "md",
  showText = true,
  className = "",
  theme = "dark",
}: LogoProps) {
  const iconSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[size];

  const textSize = {
    sm: "text-sm",
    md: "text-base font-bold",
    lg: "text-lg font-bold",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Dark Circular Badge with 'R' and cyan top-right dot (Exact match to uploaded logo) */}
      <div
        className={`${iconSize} rounded-full bg-[#0E1E38] border border-white/10 flex items-center justify-center flex-shrink-0 relative shadow-xs`}
      >
        <div className="relative flex items-center justify-center">
          <span className="font-sans font-black text-white text-[15px] leading-none tracking-tighter">
            R
          </span>
          {/* Subtle cyan corner spark */}
          <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
        </div>
      </div>

      {showText && (
        <span
          className={`tracking-tight ${textSize} ${
            theme === "dark" ? "text-white" : "text-[#0F172A]"
          }`}
        >
          Recover<span className="text-[#2563EB]">Flow</span>
        </span>
      )}
    </div>
  );
}
