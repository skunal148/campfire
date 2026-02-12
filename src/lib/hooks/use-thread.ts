"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getThreadReplies,
  sendThreadReply,
  getReplyCountsForChannel,
} from "@/lib/actions/messages";
import type { MessageWithAuthor } from "@/lib/types/database";

export function useThreadReplies(parentId: string | null) {
  return useQuery({
    queryKey: ["thread", parentId],
    queryFn: () => getThreadReplies(parentId!),
    enabled: !!parentId,
  });
}

export function useSendThreadReply(channelId: string, parentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      content: string;
      attachment?: { url: string; name: string; type: string };
    }) => sendThreadReply(channelId, parentId, input.content, input.attachment),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<MessageWithAuthor[]>(
        ["thread", parentId],
        (old) => {
          if (!old) return [newMessage];
          const exists = old.some((m) => m.id === newMessage.id);
          if (exists) return old.map((m) => (m.id === newMessage.id ? newMessage : m));
          return [...old, newMessage];
        }
      );
      queryClient.invalidateQueries({ queryKey: ["reply-counts", channelId] });
    },
  });
}

export function useReplyCounts(channelId: string) {
  return useQuery({
    queryKey: ["reply-counts", channelId],
    queryFn: () => getReplyCountsForChannel(channelId),
  });
}
