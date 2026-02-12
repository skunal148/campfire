"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
} from "@/lib/actions/messages";
import type { MessageWithAuthor } from "@/lib/types/database";

export function useMessages(channelId: string, initialData?: MessageWithAuthor[]) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => getMessages(channelId),
    initialData,
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      content: string;
      attachment?: { url: string; name: string; type: string };
    }) => sendMessage(channelId, input.content, input.attachment),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<MessageWithAuthor[]>(
        ["messages", channelId],
        (old) => {
          if (!old) return [newMessage];
          // Deduplicate: replace optimistic if exists, otherwise append
          const exists = old.some((m) => m.id === newMessage.id);
          if (exists) return old.map((m) => (m.id === newMessage.id ? newMessage : m));
          return [...old, newMessage];
        }
      );
    },
  });
}

export function useUpdateMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      updateMessage(messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
    },
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ["messages", channelId] });
      const previous = queryClient.getQueryData<MessageWithAuthor[]>(["messages", channelId]);
      queryClient.setQueryData<MessageWithAuthor[]>(
        ["messages", channelId],
        (old) => old?.filter((m) => m.id !== messageId) ?? []
      );
      return { previous };
    },
    onError: (_err, _messageId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", channelId], context.previous);
      }
    },
  });
}
