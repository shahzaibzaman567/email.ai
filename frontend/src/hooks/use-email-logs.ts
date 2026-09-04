import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export function useEmailLogs(page = 1, pageSize = 20) {
  const { getToken } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["email-logs", page, pageSize],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>(`/email-logs?page=${page}&pageSize=${pageSize}`, {
        token: token ?? undefined
      });
    },
  });

  return { logs: data?.items || [], meta: data, isLoading };
}

export function useEmailLogDetail(id: string) {
  const { getToken } = useAuth();
  const { data: log, isLoading } = useQuery({
    queryKey: ["email-logs", id],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>(`/email-logs/${id}`, {
        token: token ?? undefined
      });
    },
    enabled: !!id,
  });

  return { log, isLoading };
}
