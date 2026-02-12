"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPinnedMessages, pinMessage, unpinMessage } from "@/lib/actions/pins";

export function usePinnedMessages(channelId: string) {
  return useQuery({
    queryKey: ["pinned-messages", channelId],
    queryFn: () => getPinnedMessages(channelId),
  });
}

export function usePinMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => pinMessage(channelId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-messages", channelId] });
    },
  });
}

export function useUnpinMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => unpinMessage(channelId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-messages", channelId] });
    },
  });
}
