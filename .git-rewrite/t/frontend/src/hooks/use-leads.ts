"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, list } from "@/lib/api-client";
import { API } from "@/lib/constants";
import type { Lead, PaginationParams } from "@/types/api";

export interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    email: string | null;
    reasons: unknown;
  }>;
}

export interface BulkValidateResult {
  valid: any[];
  invalid: any[];
  duplicates: any[];
  total: number;
}

export function useCreateLeads() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: unknown[]) => {
      const token = await getToken();
      return apiRequest<BulkImportResult>(API.endpoints.leads, {
        method: "POST",
        body: { leads: input },
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLeadStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Lead["status"];
    }) => {
      const token = await getToken();
      return apiRequest<Lead>(API.endpoints.lead(id), {
        method: "PATCH",
        body: { status },
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useLeads(params: PaginationParams = {}) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["leads", params],
    queryFn: async () => {
      const token = await getToken();
      return list<Lead>(
        API.endpoints.leads,
        params as Record<string, string | number | undefined>,
        { token: token ?? undefined },
      );
    },
  });
}

export function useValidateLeads() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: unknown[]) => {
      const token = await getToken();
      return apiRequest<BulkValidateResult>(`${API.endpoints.leads}/validate`, {
        method: "POST",
        body: { leads: input },
        token: token ?? undefined,
      });
    },
  });
}

export function useDeleteLead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiRequest<void>(API.endpoints.lead(id), {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}