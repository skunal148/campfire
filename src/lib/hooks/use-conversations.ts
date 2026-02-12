"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversations, getOrCreateDM } from "@/lib/actions/dms";
import type { Conversation } from "@/lib/types/database";

export function useConversations(initialData?: Conversation[]) {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    initialData,
  });
}

export function useCreateDM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (otherUserId: string) => getOrCreateDM(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
