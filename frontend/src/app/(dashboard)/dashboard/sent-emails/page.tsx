"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmailLogs, useEmailLogDetail } from "@/hooks/use-email-logs";
import { Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SentEmailsPage() {
  const [page, setPage] = useState(1);
  const { logs, meta, isLoading } = useEmailLogs(page, 20);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sent Emails</h1>
          <p className="text-slate-500 mt-2">View the actual emails sent to your leads.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No sent emails yet. Launch a campaign!
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {log.leadId?.firstName} {log.leadId?.lastName}
                      </div>
                      <div className="text-sm text-slate-500">{log.recipient}</div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.subject || "No Subject"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.campaignId?.name || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {log.sentAt ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLogId(log._id)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EmailDetailModal logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </div>
  );
}

function EmailDetailModal({ logId, onClose }: { logId: string | null; onClose: () => void }) {
  const { log, isLoading } = useEmailLogDetail(logId || "");

  return (
    <Dialog open={!!logId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Detail</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : log ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md border">
              <div>
                <span className="text-slate-500 block mb-1">To:</span>
                <span className="font-medium">{log.recipient}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Status:</span>
                <span className={`font-semibold ${log.status === "sent" ? "text-emerald-600" : log.status === "failed" ? "text-red-600" : "text-amber-500"}`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-1">Subject:</span>
                <span className="font-medium text-base">{log.subject || "N/A"}</span>
              </div>
            </div>

            {log.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm space-y-1">
                <span className="font-bold block">Personalization / Delivery Error:</span>
                <p className="font-mono text-xs">{log.error}</p>
              </div>
            )}

            <div>
              <span className="text-slate-500 text-sm block mb-2">Message Body:</span>
              <div className="bg-white border rounded-md p-6 text-slate-700 whitespace-pre-wrap min-h-[200px] font-sans">
                {log.body}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t">
              <span>Campaign: {log.campaignId?.name}</span>
              <span>Provider ID: {log.providerMessageId || "N/A"}</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">Could not load email detail.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
