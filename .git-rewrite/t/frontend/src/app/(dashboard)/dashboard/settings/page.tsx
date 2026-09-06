import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Sending identities, integrations, and plan."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sending identities</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">No mailbox connected</Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              Connect Gmail or an SMTP mailbox to send outreach.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>Free</Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              Upgrade to increase sending limits and AI usage.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}