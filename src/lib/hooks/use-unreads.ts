"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnreadCounts } from "@/lib/actions/reads";
import { markChannelRead } from "@/lib/actions/reads";

export function useUnreadCounts() {
  return useQuery({
    queryKey: ["unread-counts"],
    queryFn: getUnreadCounts,
    refetchInterval: 30000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => markChannelRead(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });
}
