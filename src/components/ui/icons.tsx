import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const HomeIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 11L12 3.5l9 7.5v9.5h-6.5V14h-5v6.5H3z" /></svg>
);
export const LearnIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5.5C10 4 7 4 4.5 4.5v15C7 19 10 19 12 20.5c2-1.5 5-1.5 7.5-1v-15C17 4 14 4 12 5.5z" />
    <path d="M12 5.5v15" />
  </svg>
);
export const MarketsIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 20v-6M11 20V8M17 20V11M21 4l-4 4M3 20h18" /></svg>
);
export const ClubIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="9" cy="8" r="3.2" /><circle cx="17" cy="9.5" r="2.4" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M15.5 18.5c.3-2.3 2-3.8 4.5-3.8" />
  </svg>
);
export const ProfileIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c0-3.5 3.5-6 7.5-6s7.5 2.5 7.5 6" /></svg>
);
export const ChevronRight = ({ size = 14, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.5} {...p}><path d="M9 5l7 7-7 7" /></svg>
);
export const ChevronLeft = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.5} {...p}><path d="M15 5l-7 7 7 7" /></svg>
);
export const ChevronDown = ({ size = 14, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.5} {...p}><path d="M5 9l7 7 7-7" /></svg>
);
export const BellIcon = ({ size = 17, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10.5 19a1.8 1.8 0 003 0" /></svg>
);
export const ClockIcon = ({ size = 13, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const SearchIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const CheckIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size)} strokeWidth={3} {...p}><path d="M5 12l5 5L20 7" /></svg>
);
export const LockIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
);
export const PlusIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.5} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const CloseIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.5} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const InfoIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const SendIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 12l16-8-6 16-2.5-6.5z" /></svg>
);
export const BookmarkIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M6 4h12v17l-6-4-6 4z" /></svg>
);
export const HeartIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" /></svg>
);
export const CommentIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>
);
export const MoreIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none" {...p}><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
);
export const SettingsIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
);
/** Kai's four-point spark ✦ */
export const KaiSpark = ({ size = 16, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10z" />
  </svg>
);
