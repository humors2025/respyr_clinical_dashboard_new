"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InitialAvatar } from "@/components/brand-mark";

export function Topbar({
  username,
  logo,
  onMenuToggle,
}: {
  username: string;
  logo: string | null;
  onMenuToggle: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-card/90 px-4 backdrop-blur-sm lg:px-7">
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-input border border-line text-ink-2 transition-colors hover:border-blue hover:text-blue lg:hidden"
        aria-label="Toggle navigation"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-2" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-input px-1.5 py-1.5 transition-colors hover:bg-surface"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <InitialAvatar name={username} size={36} />
            )}
            <span className="hidden text-left sm:block">
              <span className="type-label block text-ink">{username}</span>
              <span className="type-micro block font-normal text-ink-3">Admin</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-ink-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-modal-in absolute right-0 top-[calc(100%+8px)] w-52 overflow-hidden rounded-input border border-line bg-card py-1 shadow-[0_12px_32px_rgba(37,37,37,0.14)]"
            >
              <div className="border-b border-line px-3.5 py-2.5">
                <p className="type-label truncate text-ink">{username}</p>
                <p className="type-micro font-normal text-ink-3">Clinic administrator</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                disabled={signingOut}
                className="type-body flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-ink-2 transition-colors hover:bg-surface hover:text-red disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
