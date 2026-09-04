"use client";

import dynamic from "next/dynamic";

const NeonOrbInner = dynamic(
  () => import("./neon-orb").then((m) => m.NeonOrb),
  { ssr: false, loading: () => <div className="w-full h-full" /> }
);

export function NeonOrbClient() {
  return <NeonOrbInner />;
}
