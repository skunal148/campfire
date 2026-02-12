"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithAuthor } from "@/lib/types/database";

export function useRealtimeMessages(channelId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Thread replies should not appear in the main message list
          if (payload.new.parent_id) {
            queryClient.invalidateQueries({ queryKey: ["reply-counts", channelId] });
            return;
          }

          // Fetch the full message with author profile
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(*)")
            .eq("id", payload.new.id)
            .single();

          if (!data) return;
          const message = data as MessageWithAuthor;

          queryClient.setQueryData<MessageWithAuthor[]>(
            ["messages", channelId],
            (old) => {
              if (!old) return [message];
              // Deduplicate against optimistic updates
              const exists = old.some((m) => m.id === message.id);
              if (exists) return old.map((m) => (m.id === message.id ? message : m));
              return [...old, message];
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(*)")
            .eq("id", payload.new.id)
            .single();

          if (!data) return;
          const message = data as MessageWithAuthor;

          queryClient.setQueryData<MessageWithAuthor[]>(
            ["messages", channelId],
            (old) => old?.map((m) => (m.id === message.id ? message : m)) ?? []
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          queryClient.setQueryData<MessageWithAuthor[]>(
            ["messages", channelId],
            (old) => old?.filter((m) => m.id !== payload.old.id) ?? []
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient, supabase]);
}
