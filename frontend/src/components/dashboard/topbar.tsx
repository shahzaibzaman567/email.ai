"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { AnalogClock } from "./analog-clock";

const TIMEZONE_LABELS: Record<string, string> = {
  "Asia/Karachi": "PKT",
  "Asia/Kolkata": "IST",
  "Asia/Dubai": "GST",
  "Europe/London": "GMT",
  "America/New_York": "EST",
  "America/Los_Angeles": "PST",
  "Asia/Tokyo": "JST",
  "Australia/Sydney": "AEDT",
  "Europe/Paris": "CET",
  "Asia/Shanghai": "CST",
  "America/Sao_Paulo": "BRT",
  "UTC": "UTC",
};

export function Topbar() {
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [label, setLabel] = useState("PKT");

  useEffect(() => {
    const saved = localStorage.getItem("worldclock_tz");
    if (saved) {
      setTimezone(saved);
      setLabel(TIMEZONE_LABELS[saved] || saved.split("/").pop() || "UTC");
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "worldclock_tz" && e.newValue) {
        setTimezone(e.newValue);
        setLabel(TIMEZONE_LABELS[e.newValue] || e.newValue.split("/").pop() || "UTC");
      }
    };
    window.addEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      const saved = localStorage.getItem("worldclock_tz");
      if (saved && saved !== timezone) {
        setTimezone(saved);
        setLabel(TIMEZONE_LABELS[saved] || saved.split("/").pop() || "UTC");
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [timezone]);

  return (
    <header className="flex h-14 items-center justify-between md:justify-end border-b border-border bg-card px-4">
      <MobileNav />
      <div className="flex items-center gap-3">
        <AnalogClock timezone={timezone} size={30} showSeconds label={label} />
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
