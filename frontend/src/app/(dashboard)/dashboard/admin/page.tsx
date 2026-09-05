"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminStats } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, Mail, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { stats, isLoading, error } = useAdminStats();

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const ownerEmail = "shahzaibzaman.official@gmail.com";
  // Case-insensitive email comparison
  const isAdmin = userEmail && userEmail.toLowerCase() === ownerEmail.toLowerCase();

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoaded, isAdmin, router]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center gap-2">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-slate-500">Only the platform owner can access the admin panel.</p>
      </div>
    );
  }

  const { totalUsers = 0, dailyStats = [] } = stats || {};

  // Calculate sum of last 30 days sent emails
  const totalSentLast30Days = dailyStats.reduce((acc: number, curr: any) => acc + (curr.sentCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h1>
        <p className="text-slate-500 mt-2">Platform performance and active user statistics.</p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <CardContent className="p-6">
            Failed to load admin analytics. Please make sure you are registered as the platform owner.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Managed Users <Users className="h-4 w-4 text-indigo-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-indigo-600">{totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">Users registered on the platform</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Emails Sent (Last 30 Days) <Mail className="h-4 w-4 text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">{totalSentLast30Days}</p>
                <p className="text-xs text-muted-foreground mt-1">Total personalize-and-send activities</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Platform Usage</CardTitle>
              <CardDescription>Visualizing active sending users and outbound email logs over the past 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {dailyStats.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400">No sending stats recorded in last 30 days.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <Tooltip />
                      <Area name="Emails Sent" type="monotone" dataKey="sentCount" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" />
                      <Area name="Active Users" type="monotone" dataKey="activeUsers" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
