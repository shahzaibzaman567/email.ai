"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useLeads } from "@/hooks/use-leads";

export default function LeadsPage() {
  const { data, isLoading } = useLeads({ page: 1, pageSize: 20 });

  return (
    <>
      <PageHeader
        title="Leads"
        description="Import and manage your prospect list."
        actions={<Button>Import leads</Button>}
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.data.length ? (
            <EmptyState
              icon={Users}
              title="No leads yet"
              description="Import a CSV or add leads manually to start outreach."
              action={<Button>Import leads</Button>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.data.map((lead) => (
                <li key={lead.id} className="flex justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {lead.firstName || lead.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email}
                      {lead.businessName ? ` · ${lead.businessName}` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {lead.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}