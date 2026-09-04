"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Screens not yet ported from the PHP portal render as inert, labelled "Soon". */
  ready: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", ready: true, icon: <GridIcon /> },
  { href: "/history", label: "Test history", ready: true, icon: <ClockIcon /> },
  { href: "/subjects", label: "Subjects", ready: true, icon: <UsersIcon /> },
  { href: "/reports", label: "Reports", ready: false, icon: <FileIcon /> },
  { href: "/settings", label: "Settings", ready: false, icon: <GearIcon /> },
];

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-card transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <BrandMark size={38} />
        <div className="flex items-center gap-2">
          <span className="type-brand text-ink">respyr</span>
          <span className="role-badge">CLINIC</span>
        </div>
      </div>

      <nav className="flex-1 px-3" aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (!item.ready) {
              return (
                <li key={item.href}>
                  <span
                    className="type-body flex cursor-not-allowed items-center gap-3 rounded-input px-3 py-2.5 text-ink-4"
                    aria-disabled="true"
                  >
                    <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                    {item.label}
                    <span className="type-micro ml-auto rounded-badge bg-surface px-1.5 py-0.5 text-ink-4">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`type-body flex items-center gap-3 rounded-input px-3 py-2.5 transition-colors ${
                    active
                      ? "bg-blue-light font-medium text-blue"
                      : "text-ink-2 hover:bg-surface hover:text-ink"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="type-micro border-t border-line px-6 py-5 text-ink-4">
        Humorstech Pvt Ltd
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <a
            href="https://respyr.in/terms-conditions/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-blue"
          >
            Terms
          </a>
          <a
            href="https://respyr.in/privacy_policy/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-blue"
          >
            Privacy
          </a>
        </div>
      </div>
    </aside>
  );
}

/* ---------- icons (1.5px stroke, matching the design system) ---------- */
const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function GridIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <path d="M14 14h7M17 17.5h4M14 21h7" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 1.9" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20v-1c0-2.5 2.4-4.2 6-4.2s6 1.7 6 4.2v1" />
      <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4c2 .6 3 1.9 3 3.6V19" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="18" r="2" />
    </svg>
  );
}
