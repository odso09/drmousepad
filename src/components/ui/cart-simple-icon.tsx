import * as React from "react";

export const CartSimpleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    stroke="#00e0ff"
    strokeWidth={3.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  aria-hidden="true"
  focusable="false"
    {...props}
  >
    <circle cx="10" cy="22" r="1.7" stroke="#00e0ff" strokeWidth={2.8} />
    <circle cx="18" cy="22" r="1.7" stroke="#00e0ff" strokeWidth={2.8} />
    <path d="M4 5h2.5l2.5 12a2.2 2.2 0 0 0 2.2 1.8h6.6a2.2 2.2 0 0 0 2.2-1.8L24 9H7" stroke="#00e0ff" strokeWidth={2.8} />
  </svg>
);