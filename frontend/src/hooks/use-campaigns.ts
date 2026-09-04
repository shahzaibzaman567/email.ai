"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, list } from "@/lib/api-client";
import { API } from "@/lib/constants";
import type { Campaign, Lead, PaginationParams } from "@/types/api";

export function useCampaigns(params: PaginationParams = {}) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["campaigns", params],
    queryFn: async () => {
      const token = await getToken();
      return list<Campaign>(
        API.endpoints.campaigns,
        params as Record<string, string | number | undefined>,
        { token: token ?? undefined },
      );
    },
  });
}

export function useCampaign(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<Campaign>(API.endpoints.campaign(id), {
        token: token ?? undefined,
      });
    },
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: unknown) => {
      const token = await getToken();
      return apiRequest<Campaign>(API.endpoints.campaigns, {
        method: "POST",
        body: input,
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
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

export function useLaunchCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadIds }: { id: string; leadIds: string[] }) => {
      const token = await getToken();
      return apiRequest<Campaign>(`${API.endpoints.campaign(id)}/launch`, {
        method: "POST",
        body: { leadIds },
        token: token ?? undefined,
      });
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["campaigns", id] });
    },
  });
}

export function usePauseCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiRequest<Campaign>(`${API.endpoints.campaign(id)}/pause`, {
        method: "POST",
        token: token ?? undefined,
      });
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["campaigns", id] });
    },
  });
}

export function useResumeCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiRequest<Campaign>(`${API.endpoints.campaign(id)}/resume`, {
        method: "POST",
        token: token ?? undefined,
      });
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["campaigns", id] });
    },
  });
}

export function useCancelCampaign() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiRequest<Campaign>(`${API.endpoints.campaign(id)}/cancel`, {
        method: "POST",
        token: token ?? undefined,
      });
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      void queryClient.invalidateQueries({ queryKey: ["campaigns", id] });
    },
  });
}