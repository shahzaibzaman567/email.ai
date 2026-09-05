"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEmailLogs,
  useEmailLogDetail,
  useDeleteEmailLog,
  useBulkDeleteEmailLogs,
} from "@/hooks/use-email-logs";
import {
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  FileSpreadsheet,
  FileCode,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function exportToCsv(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) return;

  const headers = [
    "Recipient Email",
    "Recipient First Name",
    "Recipient Last Name",
    "Company",
    "Campaign",
    "Subject",
    "Sent At",
    "Status",
    "Provider Message ID",
    "Message Body",
  ];

  const escapeCsvCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((r) =>
      [
        escapeCsvCell(r.recipient),
        escapeCsvCell(r.leadId?.firstName || ""),
        escapeCsvCell(r.leadId?.lastName || ""),
        escapeCsvCell(r.leadId?.businessName || ""),
        escapeCsvCell(r.campaignId?.name || ""),
        escapeCsvCell(r.subject || ""),
        escapeCsvCell(r.sentAt ? new Date(r.sentAt).toISOString() : ""),
        escapeCsvCell(r.status || ""),
        escapeCsvCell(r.providerMessageId || ""),
        escapeCsvCell(r.body || ""),
      ].join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToJson(filename: string, data: any[]) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function SentEmailsPage() {
  const [page, setPage] = useState(1);
  const { logs, meta, isLoading } = useEmailLogs(page, 20);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<{
    id: string;
    recipient: string;
  } | null>(null);

  const { mutateAsync: deleteEmailLog, isPending: isDeletingSingle } =
    useDeleteEmailLog();
  const { mutateAsync: bulkDeleteEmailLogs, isPending: isDeletingBulk } =
    useBulkDeleteEmailLogs();

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  const allPageIds = useMemo(
    () => (logs ? logs.map((l: any) => l._id) : []),
    [logs],
  );

  const isAllSelected =
    allPageIds.length > 0 && allPageIds.every((id: string) => selectedIds.has(id));
  const isPartiallySelected =
    allPageIds.some((id: string) => selectedIds.has(id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllSelected) {
      allPageIds.forEach((id: string) => next.delete(id));
    } else {
      allPageIds.forEach((id: string) => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const getSelectedLogs = () => {
    return logs.filter((l: any) => selectedIds.has(l._id));
  };

  const handleExportSelectedCsv = () => {
    const items = getSelectedLogs();
    if (items.length === 0) {
      toast.error("Please select at least one email to export");
      return;
    }
    const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
    exportToCsv(`sent-emails-${timestamp}.csv`, items);
    toast.success(`Exported ${items.length} emails to CSV!`);
  };

  const handleExportSelectedJson = () => {
    const items = getSelectedLogs();
    if (items.length === 0) {
      toast.error("Please select at least one email to export");
      return;
    }
    const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
    exportToJson(`sent-emails-${timestamp}.json`, items);
    toast.success(`Exported ${items.length} emails to JSON!`);
  };

  const handleExportCurrentPage = () => {
    if (!logs || logs.length === 0) {
      toast.error("No emails available to export");
      return;
    }
    const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
    exportToCsv(`sent-emails-page-${page}-${timestamp}.csv`, logs);
    toast.success(`Exported ${logs.length} emails to CSV!`);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await bulkDeleteEmailLogs(ids);
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
      toast.success(`Successfully deleted ${ids.length} sent emails`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete emails");
    }
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteTarget) return;

    try {
      await deleteEmailLog(singleDeleteTarget.id);
      const next = new Set(selectedIds);
      next.delete(singleDeleteTarget.id);
      setSelectedIds(next);
      setSingleDeleteTarget(null);
      toast.success("Sent email deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete email");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Sent Emails
          </h1>
          <p className="text-slate-500 mt-1">
            Track, export, and manage outreach emails sent to your leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCurrentPage}
            disabled={isLoading || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Page (CSV)
          </Button>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white font-medium">
              {selectedIds.size} Selected
            </Badge>
            <span className="text-sm text-blue-900 font-medium hidden sm:inline">
              emails selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelectedCsv}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelectedJson}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            >
              <FileCode className="h-4 w-4 mr-1.5 text-indigo-600" />
              Download JSON
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete ({selectedIds.size})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-slate-500 hover:text-slate-900"
            >
              Deselect
            </Button>
          </div>
        </div>
      )}

      {/* Emails Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[48px] pl-4">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center justify-center p-1 rounded hover:bg-slate-100 text-slate-600 focus:outline-none"
                    title={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : isPartiallySelected ? (
                      <MinusSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" />
                    <p className="text-xs text-slate-400 mt-2">Loading sent emails...</p>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-slate-500">
                    No sent emails yet. Launch a campaign to start sending!
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => {
                  const isSelected = selectedIds.has(log._id);
                  return (
                    <TableRow
                      key={log._id}
                      className={isSelected ? "bg-blue-50/40" : undefined}
                    >
                      <TableCell className="pl-4">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(log._id)}
                          className="flex items-center justify-center p-1 rounded hover:bg-slate-100 text-slate-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {log.leadId?.firstName || log.leadId?.lastName
                            ? `${log.leadId?.firstName || ""} ${log.leadId?.lastName || ""}`.trim()
                            : "Lead"}
                        </div>
                        <div className="text-sm text-slate-500">{log.recipient}</div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <span className="font-medium text-slate-800 truncate block">
                          {log.subject || "(No Subject)"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">
                          {log.campaignId?.name || "Campaign"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {log.sentAt
                          ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLogId(log._id)}
                            title="View email message"
                          >
                            <Eye className="h-4 w-4 mr-1 text-slate-500" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSingleDeleteTarget({
                                id: log._id,
                                recipient: log.recipient,
                              })
                            }
                            title="Delete sent email log"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t px-6 py-4 gap-3">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} (Total: {meta?.total || 0} emails)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Detail View Modal */}
      <EmailDetailModal
        logId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" /> Delete Selected Emails
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-slate-600 text-sm">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-slate-900">
              {selectedIds.size}
            </span>{" "}
            sent email logs? This action cannot be undone.
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeletingBulk}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingBulk && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog
        open={!!singleDeleteTarget}
        onOpenChange={(open) => !open && setSingleDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" /> Delete Email Log
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-slate-600 text-sm">
            Are you sure you want to delete the email record sent to{" "}
            <span className="font-semibold text-slate-900">
              {singleDeleteTarget?.recipient}
            </span>
            ?
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setSingleDeleteTarget(null)}
              disabled={isDeletingSingle}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSingleDelete}
              disabled={isDeletingSingle}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingSingle && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmailDetailModal({
  logId,
  onClose,
}: {
  logId: string | null;
  onClose: () => void;
}) {
  const { log, isLoading } = useEmailLogDetail(logId || "");

  const handleDownloadSingleEmail = () => {
    if (!log) return;
    const content = `TO: ${log.recipient}\nSUBJECT: ${log.subject || ""}\nCAMPAIGN: ${log.campaignId?.name || ""}\nDATE: ${log.sentAt ? new Date(log.sentAt).toUTCString() : ""}\nSTATUS: ${log.status}\n\n==================== BODY ====================\n\n${log.body || ""}`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `email-${log.recipient}-${format(new Date(), "yyyyMMdd-HHmm")}.txt`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Email downloaded as text file");
  };

  return (
    <Dialog open={!!logId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <DialogTitle>Email Detail</DialogTitle>
          {log && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSingleEmail}
              className="text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download (.txt)
            </Button>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : log ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md border">
              <div>
                <span className="text-slate-500 block mb-1">To:</span>
                <span className="font-medium text-slate-900">{log.recipient}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Status:</span>
                <span
                  className={`font-semibold ${
                    log.status === "sent"
                      ? "text-emerald-600"
                      : log.status === "failed"
                      ? "text-red-600"
                      : "text-amber-500"
                  }`}
                >
                  {log.status.toUpperCase()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-1">Subject:</span>
                <span className="font-medium text-base text-slate-900">
                  {log.subject || "N/A"}
                </span>
              </div>
            </div>

            {log.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm space-y-1">
                <span className="font-bold block">
                  Personalization / Delivery Error:
                </span>
                <p className="font-mono text-xs">{log.error}</p>
              </div>
            )}

            <div>
              <span className="text-slate-500 text-sm block mb-2">
                Message Body:
              </span>
              <div className="bg-white border rounded-md p-6 text-slate-700 whitespace-pre-wrap min-h-[200px] font-sans text-sm">
                {log.body}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t">
              <span>Campaign: {log.campaignId?.name || "N/A"}</span>
              <span>
                Sent:{" "}
                {log.sentAt
                  ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a")
                  : "N/A"}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Could not load email detail.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

