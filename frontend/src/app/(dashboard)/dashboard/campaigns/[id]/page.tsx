"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, XCircle, Loader2, ArrowLeft, Send, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { useCampaign, usePauseCampaign, useResumeCampaign, useCancelCampaign } from "@/hooks/use-campaigns";
import { toast } from "sonner";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: campaign, isLoading, refetch } = useCampaign(id);

  const { mutateAsync: pauseCampaign, isPending: pausing } = usePauseCampaign();
  const { mutateAsync: resumeCampaign, isPending: resuming } = useResumeCampaign();
  const { mutateAsync: cancelCampaign, isPending: canceling } = useCancelCampaign();

  // Auto-refresh stats if the campaign is actively working
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (campaign?.status === "running" || campaign?.status === "queued") {
      interval = setInterval(() => refetch(), 5000); // refresh every 5 seconds for live feel
    }
    return () => clearInterval(interval);
  }, [campaign?.status, refetch]);

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (!campaign) {
    return <div className="text-center p-20">Campaign not found</div>;
  }

  const handlePause = async () => {
    try {
      await pauseCampaign(id);
      toast.success("Campaign paused");
    } catch (err: any) {
      toast.error(err.message || "Failed to pause");
    }
  };

  const handleResume = async () => {
    try {
      await resumeCampaign(id);
      toast.success("Campaign resumed");
    } catch (err: any) {
      toast.error(err.message || "Failed to resume");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign? It cannot be restarted.")) return;
    try {
      await cancelCampaign(id);
      toast.success("Campaign cancelled");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  const total = campaign.totalLeads || 0;
  const processed = (campaign.sent || 0) + (campaign.failed || 0) + (campaign.bounced || 0) + (campaign.replied || 0);
  const progressPercent = total > 0 ? (processed / total) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2 text-sm text-slate-500 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </div>

      <PageHeader
        title={campaign.name}
        description={campaign.description || "No description provided."}
        actions={
          <div className="flex items-center gap-2">
            {campaign.status === "running" && (
              <Button variant="outline" size="sm" onClick={handlePause} disabled={pausing}>
                {pausing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Pause className="size-4 mr-2" />}
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button size="sm" onClick={handleResume} disabled={resuming} className="bg-emerald-600 hover:bg-emerald-700">
                {resuming ? <Loader2 className="size-4 animate-spin mr-2" /> : <Play className="size-4 mr-2" />}
                Resume
              </Button>
            )}
            {(campaign.status === "running" || campaign.status === "paused" || campaign.status === "queued" || campaign.status === "draft") && (
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={canceling}>
                {canceling ? <Loader2 className="size-4 animate-spin mr-2" /> : <XCircle className="size-4 mr-2" />}
                Cancel
              </Button>
            )}
            <Badge variant="outline" className={`ml-2 uppercase tracking-wide
              ${campaign.status === 'running' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                campaign.status === 'paused' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                campaign.status === 'completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}
            `}>
              {campaign.status}
            </Badge>
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Progress</CardTitle>
            <CardDescription>Real-time updates on email sending and processing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-700">Total Progress</span>
                <span className="text-sm font-bold text-slate-900">{processed} / {total} Leads</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {total > 0 && (
                  <>
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${((campaign.replied || 0) / total) * 100}%` }} title="Replied" />
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${((campaign.sent || 0) / total) * 100}%` }} title="Sent" />
                    <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${((campaign.bounced || 0) / total) * 100}%` }} title="Bounced" />
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${((campaign.failed || 0) / total) * 100}%` }} title="Failed" />
                    {['running', 'queued'].includes(campaign.status) && (
                      <div className="bg-slate-300 h-full transition-all duration-500 animate-pulse" style={{ width: `${(((campaign.queued || 0) + (campaign.processing || 0)) / total) * 100}%` }} />
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col items-center">
                <Send className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-2xl font-bold text-slate-900">{campaign.sent || 0}</span>
                <span className="text-xs text-slate-500">Sent</span>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex flex-col items-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-1" />
                <span className="text-2xl font-bold text-emerald-900">{campaign.replied || 0}</span>
                <span className="text-xs text-emerald-600">Replied</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex flex-col items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mb-1" />
                <span className="text-2xl font-bold text-amber-900">{campaign.bounced || 0}</span>
                <span className="text-xs text-amber-600">Bounced</span>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-100 flex flex-col items-center">
                <XCircle className="h-5 w-5 text-red-500 mb-1" />
                <span className="text-2xl font-bold text-red-900">{campaign.failed || 0}</span>
                <span className="text-xs text-red-600">Failed</span>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-md">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300 animate-pulse" /> {campaign.queued || 0} Queued</div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-300 animate-pulse" /> {campaign.processing || 0} Processing</div>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Subject Strategy</p>
              <p className="text-sm text-slate-900 mt-1">{campaign.subjectStrategy || "None"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Sender Identity</p>
              <p className="text-sm text-slate-900 mt-1">{campaign.senderIdentity || "None"}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-slate-500">Timeline</p>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(campaign.createdAt).toLocaleString()}</span>
                </div>
                {campaign.startedAt && (
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{new Date(campaign.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {campaign.completedAt && (
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span>{new Date(campaign.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}