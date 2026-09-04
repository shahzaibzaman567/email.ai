"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCampaign } from "@/hooks/use-campaigns";
import { useLeads } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Rocket, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { mutateAsync: createCampaign, isPending } = useCreateCampaign();
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ pageSize: 100 });
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Settings overrides
  const [useOverrides, setUseOverrides] = useState(false);
  const [settings, setSettings] = useState<any>({});
  
  // Scheduling
  const [scheduledTime, setScheduledTime] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  const [previewing, setPreviewing] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<{subject: string, body: string} | null>(null);

  const handleToggleLead = (id: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeads(newSet);
  };

  const handleSelectAll = () => {
    if (!leadsData?.data) return;
    if (selectedLeads.size === leadsData.data.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leadsData.data.map(l => l.id)));
    }
  };

  const handleCreate = async () => {
    if (!name) return toast.error("Campaign name is required");
    if (selectedLeads.size === 0) return toast.error("Select at least one lead");

    try {
      const payload: any = {
        name,
        description,
        leadIds: Array.from(selectedLeads)
      };
      
      if (useOverrides) {
        payload.settings = { ...settings };
      } else {
        payload.settings = {};
      }
      
      if (scheduledTime) {
        payload.settings.scheduledTime = scheduledTime;
        payload.settings.timezone = timezone;
      }
      
      const res = await createCampaign(payload);
      toast.success("Campaign created and launched!");
      router.push(`/dashboard/campaigns/${res.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    }
  };

  const handlePreview = async () => {
    if (selectedLeads.size === 0) return toast.error("Select at least one lead to preview");
    
    setPreviewing(true);
    setPreviewEmail(null);
    try {
      const leadId = Array.from(selectedLeads)[0];
      const token = await getToken();
      const res = await apiRequest<any>("/email-preview", {
        method: "POST",
        body: {
          leadId,
          campaignSettingsOverrides: useOverrides ? settings : {}
        },
        token: token ?? undefined
      });
      setPreviewEmail(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate preview");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Campaign</h1>
          <p className="text-slate-500 mt-2">Configure and launch your cold email campaign.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="lg" 
            onClick={handlePreview} 
            disabled={selectedLeads.size === 0 || previewing}
          >
            {previewing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Eye className="mr-2 h-5 w-5" />}
            Preview Email
          </Button>
          <Button 
            size="lg" 
            onClick={handleCreate} 
            disabled={isPending || selectedLeads.size === 0}
            className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:-translate-y-0.5"
          >
            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Rocket className="mr-2 h-5 w-5" />}
            Launch Campaign
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Q3 Founders Outreach"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Internal notes about this campaign"
                />
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Schedule (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Send Time</label>
                    <input 
                      type="time" 
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {Intl.supportedValuesOf("timeZone").map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Leave time empty to launch immediately. 
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings Overrides</CardTitle>
              <CardDescription>Optionally override your global cold email settings for this campaign only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" 
                  id="useOverrides"
                  checked={useOverrides}
                  onChange={(e) => setUseOverrides(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="useOverrides" className="text-sm font-medium cursor-pointer">Enable Settings Overrides</label>
              </div>

              {useOverrides && (
                <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Override Tone</label>
                    <input 
                      type="text" 
                      value={settings.tone || ""}
                      onChange={(e) => setSettings({...settings, tone: e.target.value})}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Extremely urgent, casual"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Override Call to Action</label>
                    <input 
                      type="text" 
                      value={settings.cta || ""}
                      onChange={(e) => setSettings({...settings, cta: e.target.value})}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Reply with YES if interested"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Leads</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{selectedLeads.size} selected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
              ) : leadsData?.data.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed">
                  <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No leads found.</p>
                  <Button variant="link" onClick={() => router.push("/dashboard/leads/import")} className="mt-2 text-blue-600">
                    Import Leads
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <input 
                      type="checkbox" 
                      id="selectAll"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedLeads.size > 0 && selectedLeads.size === leadsData?.data.length}
                      onChange={handleSelectAll}
                    />
                    <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">Select All ({leadsData?.data.length})</label>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                    {leadsData?.data.map(lead => (
                      <div key={lead.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => handleToggleLead(lead.id)}
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-slate-900 truncate">{lead.email}</p>
                          {(lead.firstName || lead.businessName) && (
                            <p className="text-xs text-slate-500 truncate">
                              {[lead.firstName, lead.lastName].filter(Boolean).join(" ")} 
                              {lead.businessName && ` • ${lead.businessName}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={!!previewEmail} onOpenChange={(open) => !open && setPreviewEmail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview (First Selected Lead)</DialogTitle>
          </DialogHeader>
          {previewEmail && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 border rounded-md">
                <span className="text-slate-500 text-sm block mb-1">Subject:</span>
                <span className="font-semibold text-lg">{previewEmail.subject}</span>
              </div>
              <div>
                <span className="text-slate-500 text-sm block mb-1">Body:</span>
                <div className="bg-white p-6 border rounded-md whitespace-pre-wrap font-sans text-slate-800 min-h-[200px]">
                  {previewEmail.body}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
