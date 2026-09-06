import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@clerk/nextjs";

export function useAiInstructions() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: instructions, isLoading } = useQuery({
    queryKey: ["ai-instructions"],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/ai-training/instructions", {
        token: token ?? undefined
      });
    },
  });

  const addInstruction = useMutation({
    mutationFn: async (data: { instruction: string }) => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/ai-training/instructions", {
        method: "POST",
        body: data,
        token: token ?? undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-instructions"] });
    },
  });

  const deleteInstruction = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiRequest<any>(`/api/v1/ai-training/instructions/${id}`, {
        method: "DELETE",
        token: token ?? undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-instructions"] });
    },
  });

  return { instructions, isLoading, addInstruction, deleteInstruction };
}

export function useAiChat() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ["ai-chat"],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/ai-training/chat", {
        token: token ?? undefined
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { message: string }) => {
      const token = await getToken();
      return apiRequest<any>("/api/v1/ai-training/chat", {
        method: "POST",
        body: data,
        token: token ?? undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-chat"] });
      queryClient.invalidateQueries({ queryKey: ["ai-instructions"] });
    },
  });

  return { chatHistory, isLoading, sendMessage };
}
