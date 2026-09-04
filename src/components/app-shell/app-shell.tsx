"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  username,
  logo,
  children,
}: {
  username: string;
  logo: string | null;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

      {navOpen && (
        <button
          type="button"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-[rgba(37,37,37,0.35)] backdrop-blur-[3px] lg:hidden"
          aria-label="Close navigation"
        />
      )}

      <div className="lg:pl-[248px]">
        <Topbar username={username} logo={logo} onMenuToggle={() => setNavOpen((v) => !v)} />
        <main className="px-4 py-6 lg:px-7 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
