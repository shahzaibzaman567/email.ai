import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export function useEmailLogs(page = 1, pageSize = 20) {
  const { getToken } = useAuth();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["email-logs", page, pageSize],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>(`/api/v1/email-logs?page=${page}&pageSize=${pageSize}`, {
        token: token ?? undefined,
      });
    },
  });

  return { logs: data?.items || [], meta: data, isLoading, refetch };
}

export function useEmailLogDetail(id: string) {
  const { getToken } = useAuth();
  const { data: log, isLoading } = useQuery({
    queryKey: ["email-logs", id],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>(`/api/v1/email-logs/${id}`, {
        token: token ?? undefined,
      });
    },
    enabled: !!id,
  });

  return { log, isLoading };
}

export function useDeleteEmailLog() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiRequest<any>(`/api/v1/email-logs/${id}`, {
        method: "DELETE",
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
  });
}

export function useBulkDeleteEmailLogs() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const token = await getToken();
      return apiRequest<any>(`/api/v1/email-logs/bulk-delete`, {
        method: "POST",
        body: { ids },
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
  });
}

