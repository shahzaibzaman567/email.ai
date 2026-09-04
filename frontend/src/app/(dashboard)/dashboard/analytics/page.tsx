"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Delivery, open, and reply metrics across campaigns."
      />
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Once campaigns start sending, charts will appear here."
          />
        </CardContent>
      </Card>
    </>
  );
}