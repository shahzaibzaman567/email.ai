"use client";

import { Plus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useCampaigns } from "@/hooks/use-campaigns";

export default function CampaignsPage() {
  const { data, isLoading } = useCampaigns({ page: 1, pageSize: 20 });

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Create and manage your outreach sequences."
        actions={
          <Button>
            <Plus className="size-4" />
            New campaign
          </Button>
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