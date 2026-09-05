import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export function useAdminStats() {
  const { getToken } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/admin/dashboard", {
        token: token ?? undefined
      });
    },
  });

  return { stats: data || null, isLoading, error };
}
