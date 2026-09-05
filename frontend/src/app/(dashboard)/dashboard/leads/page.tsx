"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Upload,
  Search,
  Trash2,
  ExternalLink,
  Globe,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useLeads, useDeleteLead } from "@/hooks/use-leads";
import { toast } from "sonner";
import type { Lead } from "@/types/api";

const STATUS_VARIANTS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  replied: "bg-blue-100 text-blue-800 border-blue-200",
  bounced: "bg-rose-100 text-rose-800 border-rose-200",
  unsubscribed: "bg-slate-100 text-slate-800 border-slate-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  queued: "bg-purple-100 text-purple-800 border-purple-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads({
    page,
    pageSize: 20,
    search: search || undefined,
    status: (statusFilter as any) || undefined,
  });

  const { mutateAsync: deleteLead, isPending: isDeleting } = useDeleteLead();

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  const handleDelete = async (leadId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete lead ${email}?`)) return;
    try {
      await deleteLead(leadId);
      toast.success("Lead deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete lead");
    }
  };

  return (
    <>
      <PageHeader
        title="Leads"
        description="Import, manage and organize your prospect list."
        actions={
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/dashboard/leads/import">
              <Upload className="h-4 w-4 mr-2" />
              Import Leads
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["", "pending", "sent", "replied", "bounced"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className="capitalize"
            >
              {st === "" ? "All Leads" : st}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.data.length ? (
            <div className="py-12">
              <EmptyState
                icon={Users}
                title={search || statusFilter ? "No matching leads found" : "No leads yet"}
                description={
                  search || statusFilter
                    ? "Try adjusting your search or filter criteria."
                    : "Import a CSV or Excel spreadsheet to start your cold email outreach."
                }
                action={
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Link href="/dashboard/leads/import">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Leads
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company & Web</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pain Point / Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {lead.firstName || lead.lastName
                            ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
                            : "Unnamed Lead"}
                        </div>
                        <div className="text-sm text-slate-500">{lead.email}</div>
                      </TableCell>
                      <TableCell>
                        {lead.businessName ? (
                          <div className="flex items-center text-sm font-medium text-slate-800">
                            <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            {lead.businessName}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:underline mt-0.5"
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            {lead.website.replace(/^https?:\/\//i, "")}
                            <ExternalLink className="h-2.5 w-2.5 ml-1" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize font-medium ${
                            STATUS_VARIANTS[lead.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm text-slate-600 truncate">
                          {lead.problem || lead.notes || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                            title="View lead details"
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.id, lead.email)}
                            disabled={isDeleting}
                            title="Delete lead"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t px-6 py-4 gap-4">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of{" "}
                  <span className="font-semibold text-slate-900">{data.total}</span> leads
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
                  <span className="text-xs text-slate-500 px-2">
                    Page {page} of {totalPages}
                  </span>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-lg border">
                <div>
                  <span className="text-xs text-slate-400 block">First Name</span>
                  <span className="font-medium text-slate-900">{selectedLead.firstName || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Last Name</span>
                  <span className="font-medium text-slate-900">{selectedLead.lastName || "-"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 block">Email Address</span>
                  <span className="font-medium text-slate-900">{selectedLead.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Company</span>
                  <span className="font-medium text-slate-900">{selectedLead.businessName || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Website</span>
                  {selectedLead.website ? (
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline truncate block"
                    >
                      {selectedLead.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              {selectedLead.problem && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                    Problem / Pain Point
                  </span>
                  <div className="bg-slate-50 p-3 rounded-md border text-sm text-slate-700">
                    {selectedLead.problem}
                  </div>
                </div>
              )}

              {selectedLead.notes && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                    Notes
                  </span>
                  <div className="bg-slate-50 p-3 rounded-md border text-sm text-slate-700">
                    {selectedLead.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t">
                <span>Status: <Badge variant="outline" className="ml-1 capitalize">{selectedLead.status}</Badge></span>
                <span>ID: {selectedLead.id}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}