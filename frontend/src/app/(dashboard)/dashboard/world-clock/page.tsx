"use client";

import { useState, useEffect } from "react";
import { AnalogClock } from "@/components/dashboard/analog-clock";
import { toast } from "sonner";
import { Check } from "lucide-react";

const COMMON_TIMEZONES = [
  { label: "Pakistan (PKT)", value: "Asia/Karachi" },
  { label: "India (IST)", value: "Asia/Kolkata" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "New York (EST/EDT)", value: "America/New_York" },
  { label: "Los Angeles (PST/PDT)", value: "America/Los_Angeles" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEDT)", value: "Australia/Sydney" },
  { label: "Paris (CET)", value: "Europe/Paris" },
  { label: "Beijing (CST)", value: "Asia/Shanghai" },
  { label: "São Paulo (BRT)", value: "America/Sao_Paulo" },
  { label: "UTC", value: "UTC" },
];

function getDigitalTime(timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date());
}

function getDateString(timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date());
}

export default function WorldClockPage() {
  const [selectedTz, setSelectedTz] = useState("Asia/Karachi");
  const [digitalTime, setDigitalTime] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [utcOffset, setUtcOffset] = useState("");
  const [savedTz, setSavedTz] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("worldclock_tz");
    if (saved) {
      setSelectedTz(saved);
      setSavedTz(saved);
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      setDigitalTime(getDigitalTime(selectedTz));
      setDateStr(getDateString(selectedTz));
      // Calculate UTC offset
      const now = new Date();
      const tzStr = now.toLocaleString("en-US", { timeZone: selectedTz, timeZoneName: "short" });
      const match = tzStr.match(/[A-Z]{2,4}$/);
      setUtcOffset(match ? match[0] : "");
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [selectedTz]);

  const handleSetAsEmailTimezone = () => {
    localStorage.setItem("worldclock_tz", selectedTz);
    setSavedTz(selectedTz);
    const label = COMMON_TIMEZONES.find((tz) => tz.value === selectedTz)?.label ?? selectedTz;
    toast.success(`${label} set as your email schedule timezone`);
  };

  const selectedLabel = COMMON_TIMEZONES.find((tz) => tz.value === selectedTz)?.label ?? selectedTz;
  const isCurrentTzSaved = savedTz === selectedTz;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">World Clock</h1>
        <p className="text-muted-foreground mt-2">
          Select a timezone to see the current local time. Use this to configure your email send schedule.
        </p>
      </div>

      {/* Timezone selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Select Timezone (Origin)</label>
        <select
          value={selectedTz}
          onChange={(e) => setSelectedTz(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
          <optgroup label="── All Timezones ──">
            {Intl.supportedValuesOf("timeZone")
              .filter((tz) => !COMMON_TIMEZONES.find((c) => c.value === tz))
              .map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
          </optgroup>
        </select>
      </div>

      {/* Clock display */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-8 flex flex-col items-center gap-6">
        <AnalogClock timezone={selectedTz} size={200} showSeconds />

        <div className="text-center space-y-1">
          <div className="text-5xl font-mono font-bold tracking-tight tabular-nums">
            {digitalTime}
          </div>
          <div className="text-muted-foreground text-sm font-medium">
            {utcOffset} — {selectedLabel}
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            {dateStr}
          </div>
        </div>

        <button
          onClick={handleSetAsEmailTimezone}
          disabled={isCurrentTzSaved}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="h-4 w-4" />
          {isCurrentTzSaved ? "Already Set" : "Set as Email Timezone"}
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          This timezone will be used for your Cold Email schedule.
        </p>
      </div>

      {/* All timezones grid */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Popular Zones</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {COMMON_TIMEZONES.filter((tz) => tz.value !== selectedTz).slice(0, 8).map((tz) => (
            <button
              key={tz.value}
              onClick={() => setSelectedTz(tz.value)}
              className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-accent transition-colors"
            >
              <AnalogClock timezone={tz.value} size={36} showSeconds={false} />
              <div>
                <p className="text-sm font-medium">{tz.label}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {getDigitalTime(tz.value)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
