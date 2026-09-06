"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { API } from "@/lib/constants";
import type { Campaign, Lead } from "@/types/api";

export interface AnalyticsData {
  metrics: {
    totalLeads: number;
    emailsSent: number;
    pending: number;
    failed: number;
    bounced: number;
    replies: number;
    unsubscribed: number;
  };
  campaigns: Array<{
    id: string;
    name: string;
    status: Campaign["status"];
    totalLeads: number;
    processedLeads: number;
    sent: number;
    failed: number;
    bounced: number;
    replied: number;
  }>;
  leads: Array<{
    id: string;
    name: string;
    business?: string;
    email: string;
    status: Lead["status"];
    lastAttempt?: string;
  }>;
}

export function useAnalytics() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<AnalyticsData>(API.endpoints.analytics, {
        token: token ?? undefined,
      });
    },
    // Refresh dashboard every 30 seconds
    refetchInterval: 30000,
  });
}
