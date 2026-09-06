"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnalogClockProps {
  timezone?: string;
  size?: number;
  className?: string;
  /** Show a second hand */
  showSeconds?: boolean;
  label?: string;
}

export function AnalogClock({
  timezone = "Asia/Karachi",
  size = 40,
  className,
  showSeconds = true,
  label,
}: AnalogClockProps) {
  const [time, setTime] = useState<{ h: number; m: number; s: number } | null>(null);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
        timeZone: timezone,
      });
      const parts = fmt.formatToParts(now);
      const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
      const h = get("hour") % 12;
      const m = get("minute");
      const s = get("second");
      setTime({ h, m, s });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [timezone]);

  if (!time) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1.5;

  const deg = (val: number, max: number, extra = 0) =>
    ((val + extra) / max) * 360 - 90;

  const handCoords = (angleDeg: number, length: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + length * Math.cos(rad),
      y: cy + length * Math.sin(rad),
    };
  };

  const hourAngle = deg(time.h, 12, time.m / 60);
  const minuteAngle = deg(time.m, 60, time.s / 60);
  const secondAngle = deg(time.s, 60);

  const hourEnd = handCoords(hourAngle, r * 0.52);
  const minuteEnd = handCoords(minuteAngle, r * 0.72);
  const secondEnd = handCoords(secondAngle, r * 0.78);

  // Tick marks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 360 - 90;
    const rad = (a * Math.PI) / 180;
    const outer = r;
    const inner = r - (i % 3 === 0 ? r * 0.2 : r * 0.12);
    return {
      x1: cx + outer * Math.cos(rad),
      y1: cy + outer * Math.sin(rad),
      x2: cx + inner * Math.cos(rad),
      y2: cy + inner * Math.sin(rad),
      major: i % 3 === 0,
    };
  });

  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
        {/* Ticks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="currentColor"
            strokeWidth={t.major ? 1.2 : 0.7}
            opacity={t.major ? 0.6 : 0.35}
          />
        ))}
        {/* Hour hand */}
        <line
          x1={cx} y1={cy} x2={hourEnd.x} y2={hourEnd.y}
          stroke="currentColor" strokeWidth={size < 48 ? 1.8 : 2.4}
          strokeLinecap="round" opacity="0.9"
        />
        {/* Minute hand */}
        <line
          x1={cx} y1={cy} x2={minuteEnd.x} y2={minuteEnd.y}
          stroke="currentColor" strokeWidth={size < 48 ? 1.2 : 1.8}
          strokeLinecap="round" opacity="0.8"
        />
        {/* Second hand */}
        {showSeconds && (
          <line
            x1={cx} y1={cy} x2={secondEnd.x} y2={secondEnd.y}
            stroke="#ef4444" strokeWidth={size < 48 ? 0.8 : 1}
            strokeLinecap="round" opacity="0.9"
          />
        )}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={size < 48 ? 1.5 : 2} fill="currentColor" opacity="0.8" />
      </svg>
      {label && (
        <span className="text-[9px] font-medium opacity-50 tracking-wide leading-none">{label}</span>
      )}
    </div>
  );
}
