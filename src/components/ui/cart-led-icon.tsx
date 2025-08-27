import * as React from "react";

export const CartLedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="6" width="18" height="13" rx="3" fill="#00e0ff" fillOpacity="0.15" />
    <path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="#00e0ff" strokeWidth="2.2"/>
    <rect x="7" y="10" width="10" height="5" rx="1.5" stroke="#00e0ff" strokeWidth="2"/>
    <circle cx="9" cy="17.5" r="1.2" fill="#00e0ff" />
    <circle cx="15" cy="17.5" r="1.2" fill="#00e0ff" />
  </svg>
);
