"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Send,
  Settings,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Send },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/sent-emails", label: "Sent Emails", icon: FileText },
  { href: "/dashboard/ai-training", label: "AI Training", icon: BarChart3 },
  { href: "/dashboard/cold-email-settings", label: "Cold Email Settings", icon: Settings },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === "shahzaibzaman.official@gmail.com";

  return (
    <aside className={cn(
      "shrink-0 bg-card border-r border-border",
      mobile ? "flex flex-col w-full h-full border-r-0" : "hidden md:flex md:flex-col w-60"
    )}>
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
          AI
        </div>
        <span className="font-semibold">Email AI</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mt-4 border-t pt-4 border-dashed border-slate-200",
              pathname.startsWith("/dashboard/admin")
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <ShieldCheck className="size-4 text-red-500" />
            Admin Panel
          </Link>
        )}
      </nav>
    </aside>
  );
}