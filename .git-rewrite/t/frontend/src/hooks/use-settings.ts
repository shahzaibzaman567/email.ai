import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export function useSettings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/settings/cold-email", {
        token: token ?? undefined
      });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/settings/cold-email", {
        method: "PUT",
        body: data,
        token: token ?? undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return { settings, isLoading, updateSettings };
}
