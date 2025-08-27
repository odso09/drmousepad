import * as React from "react";

export const CartGlowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect x="2" y="6" width="20" height="13" rx="4" fill="#0ff" fillOpacity="0.10" />
    <path d="M7 6V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" stroke="#00e0ff" strokeWidth="2.2" filter="url(#glow)"/>
    <rect x="8" y="10" width="8" height="5" rx="1.5" stroke="#00e0ff" strokeWidth="2" filter="url(#glow)"/>
    <circle cx="10" cy="17.5" r="1.2" fill="#00e0ff" filter="url(#glow)" />
    <circle cx="14" cy="17.5" r="1.2" fill="#00e0ff" filter="url(#glow)" />
  </svg>
);
