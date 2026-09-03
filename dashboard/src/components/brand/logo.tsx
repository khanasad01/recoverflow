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
    md: "text-base",
    lg: "text-lg",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Razorpay + RecoverFlow Geometric Mark */}
      <div
        className={`${iconSize} rounded-md bg-[#0B1B33] border border-white/15 p-1 flex items-center justify-center flex-shrink-0 relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Razorpay Rail Lightning Vector */}
          <path
            d="M13.5 2L4 13.5H11L9.5 22L20 9.5H13L13.5 2Z"
            fill="#E11D48"
          />
          {/* Recovery Rail Arc */}
          <path
            d="M3 5C5.5 3 8.5 2 12 2C17.5 2 22 6.5 22 12C22 14.5 21 16.8 19.5 18.5"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight ${textSize} ${
                theme === "dark" ? "text-white" : "text-[#0F172A]"
              }`}
            >
              Recover<span className="text-[#E11D48]">Flow</span>
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-sans font-medium text-[#94A3B8] tracking-wide">
              by
            </span>
            <span className="text-[9px] font-bold text-[#E11D48] tracking-wider uppercase">
              Razorpay
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
