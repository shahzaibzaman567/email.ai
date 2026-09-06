"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Reusable email templates with AI placeholders."
        actions={<Button>New template</Button>}
      />
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create a template to reuse across campaigns."
            action={<Button>New template</Button>}
          />
        </CardContent>
      </Card>
    </>
  );
}