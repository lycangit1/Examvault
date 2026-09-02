import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizeMap = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Hexagonal Cyber-Shield Isometric Logo SVG */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizeMap[size]} rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-1.5 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        >
          {/* Hexagonal Outer Shield */}
          <path
            d="M24 3L42 12V27C42 36.5 34.5 43.5 24 46C13.5 43.5 6 36.5 6 27V12L24 3Z"
            stroke="url(#shield_gradient)"
            strokeWidth="3"
            strokeLinejoin="round"
            fill="#030712"
            fillOpacity="0.85"
          />
          {/* Inner Vault Core Ring */}
          <circle
            cx="24"
            cy="24"
            r="9"
            stroke="url(#core_gradient)"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          {/* Padlock Aperture Keyhole */}
          <path
            d="M24 19C22.34 19 21 20.34 21 22V24H27V22C27 20.34 25.66 19 24 19Z"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="20"
            y="24"
            width="8"
            height="6"
            rx="1.5"
            fill="#06B6D4"
          />
          <circle cx="24" cy="27" r="1" fill="#030712" />

          {/* Gradients */}
          <defs>
            <linearGradient id="shield_gradient" x1="6" y1="3" x2="42" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="core_gradient" x1="15" y1="15" x2="33" y2="33" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06B6D4" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className={`font-mono font-extrabold tracking-tight flex items-center leading-none ${titleSizeMap[size]}`}>
          <span className="text-white">Exam</span>
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent ml-0.5">
            Vault
          </span>
        </div>
        {showSubtitle && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
            Enterprise Security Core
          </span>
        )}
      </div>
    </div>
  );
};
