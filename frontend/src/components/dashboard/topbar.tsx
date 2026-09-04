"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between md:justify-end border-b border-border bg-card px-4">
      {/* Mobile: show hamburger; Desktop: hidden (sidebar shows the logo) */}
      <MobileNav />

      {/* Right side: ThemeToggle + UserButton — always visible */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8",
            },
          }}
        />
      </div>
    </header>
  );
}