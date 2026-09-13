"use client";

import { useState } from "react";
import { Plus, Rocket, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useCampaigns, useDeleteAllCampaigns } from "@/hooks/use-campaigns";
import { toast } from "sonner";

export default function CampaignsPage() {
  const { data, isLoading } = useCampaigns({ page: 1, pageSize: 100 });
  const { mutateAsync: deleteAllCampaigns, isPending: isDeletingAll } = useDeleteAllCampaigns();

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL campaigns? This action cannot be undone.")) return;
    try {
      await deleteAllCampaigns();
      toast.success("All campaigns deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete campaigns");
    }
  };

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Create and manage your outreach sequences."
        actions={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeletingAll || !data?.data.length}
            >
              {isDeletingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete All
            </Button>
            <Button>
              <Plus className="size-4" />
              New campaign
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.data.length ? (
            <EmptyState
              icon={Rocket}
              title="No campaigns yet"
              description="Create your first outreach sequence to get started."
              action={<Button>New campaign</Button>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.data.map((campaign) => (
                <li key={campaign.id} className="py-3">
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.status} · {campaign.totalLeads || 0} leads
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
