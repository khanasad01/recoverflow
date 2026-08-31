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
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* SVG Icon: Flowing 'R' with upward recovery momentum arrow */}
      <div
        className={`${iconSize} rounded-xl bg-gradient-to-br from-[#0B5FFF] to-[#00D4FF] p-[1.5px] shadow-lg shadow-[#0B5FFF]/25 flex-shrink-0 flex items-center justify-center`}
      >
        <div className="w-full h-full bg-[#0A1E3C] rounded-[10px] flex items-center justify-center p-1.5">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-white"
          >
            {/* Flowing 'R' backbone */}
            <path
              d="M7 6C7 4.89543 7.89543 4 9 4H18C21.866 4 25 7.13401 25 11C25 14.1508 22.919 16.8166 20.0384 17.6528L25.4142 26.2343C25.9686 27.1213 25.3308 28.2857 24.2818 28.2857H19.5858C18.9902 28.2857 18.4372 27.9497 18.1657 27.4206L13.5 18.5H11V27C11 27.5523 10.5523 28 10 28H8C7.44772 28 7 27.5523 7 27V6Z"
              fill="url(#rf-grad-1)"
            />
            {/* Inner negative space / upward growth vector */}
            <path
              d="M11 8.5V14H17.5C19.1569 14 20.5 12.6569 20.5 11C20.5 9.34315 19.1569 8.5 17.5 8.5H11Z"
              fill="#0A1E3C"
            />
            {/* Accent Cyan Recovery Spark */}
            <circle cx="21" cy="7" r="2.5" fill="#00D4FF" />
            <defs>
              <linearGradient
                id="rf-grad-1"
                x1="7"
                y1="4"
                x2="26"
                y2="28"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00D4FF" />
                <stop offset="0.5" stopColor="#0B5FFF" />
                <stop offset="1" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-tight ${textSize} ${
              theme === "dark" ? "text-white" : "text-[#0F172A]"
            }`}
          >
            Recover<span className="text-[#00D4FF]">Flow</span>
          </span>
          <span className="text-[9px] font-mono tracking-widest uppercase font-semibold text-[#00D4FF]/90 mt-0.5">
            Enterprise Recovery
          </span>
        </div>
      )}
    </div>
  );
}
