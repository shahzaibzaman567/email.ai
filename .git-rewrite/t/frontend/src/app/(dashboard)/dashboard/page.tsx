"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Mail, Reply, Plus, AlertCircle } from "lucide-react";

export default function DashboardOverviewPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  const { data: analytics, isLoading } = useAnalytics();

  if (!isLoaded || !userId || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { metrics, campaigns, leads } = analytics || { 
    metrics: { totalLeads: 0, emailsSent: 0, pending: 0, failed: 0, bounced: 0, replies: 0, unsubscribed: 0 },
    campaigns: [],
    leads: []
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your outreach performance in real-time."
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/leads/import")}>
            Import Leads
          </Button>
          <Button onClick={() => router.push("/dashboard/campaigns/create")}>
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Leads <Users className="h-4 w-4 text-muted-foreground/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.unsubscribed} unsubscribed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Emails Sent <Mail className="h-4 w-4 text-blue-500/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{metrics.emailsSent}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.pending} sending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Replies <Reply className="h-4 w-4 text-emerald-500/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{metrics.replies}</p>
            {metrics.emailsSent > 0 && (
              <p className="text-xs text-emerald-600/70 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {((metrics.replies / metrics.emailsSent) * 100).toFixed(1)}% rate
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Failures <AlertCircle className="h-4 w-4 text-red-500/70" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{metrics.failed + metrics.bounced}</p>
            <p className="text-xs text-red-600/70 mt-1">{metrics.bounced} bounces</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>Track the real-time progress of your ongoing outreach.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active campaigns.</p>
                <Button variant="link" onClick={() => router.push("/dashboard/campaigns/create")}>Create one now</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="space-y-2">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => router.push(`/dashboard/campaigns/${camp.id}`)}>
                      <div>
                        <h4 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">{camp.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={camp.status === 'running' ? 'default' : 'secondary'} className={camp.status === 'running' ? 'bg-blue-600' : ''}>
                            {camp.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{camp.processedLeads} / {camp.totalLeads} processed</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-emerald-600">{camp.replied} replies</span>
                      </div>
                    </div>
                    {camp.totalLeads > 0 && (
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(camp.replied / camp.totalLeads) * 100}%` }} />
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${(camp.sent / camp.totalLeads) * 100}%` }} />
                        <div className="bg-red-500 h-full transition-all" style={{ width: `${((camp.failed + camp.bounced) / camp.totalLeads) * 100}%` }} />
                        <div className="bg-blue-300 h-full transition-all animate-pulse" style={{ width: `${((camp.totalLeads - camp.processedLeads) / camp.totalLeads) * 100}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No leads yet.</p>
            ) : (
              <div className="space-y-4">
                {leads.map(lead => (
                  <div key={lead.id} className="flex justify-between items-center text-sm">
                    <div className="truncate pr-2">
                      <p className="font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                    <Badge variant="outline" className={
                      lead.status === 'sent' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                      lead.status === 'replied' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                      lead.status === 'failed' ? 'border-red-200 text-red-700 bg-red-50' :
                      'bg-slate-50 text-slate-600'
                    }>
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}