"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithAuthor } from "@/lib/types/database";

export function useRealtimeThread(parentId: string | null, channelId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!parentId) return;

    const channel = supabase
      .channel(`thread:${parentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `parent_id=eq.${parentId}`,
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
            ["thread", parentId],
            (old) => {
              if (!old) return [message];
              const exists = old.some((m) => m.id === message.id);
              if (exists) return old.map((m) => (m.id === message.id ? message : m));
              return [...old, message];
            }
          );
          queryClient.invalidateQueries({ queryKey: ["reply-counts", channelId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `parent_id=eq.${parentId}`,
        },
        (payload) => {
          queryClient.setQueryData<MessageWithAuthor[]>(
            ["thread", parentId],
            (old) => old?.filter((m) => m.id !== payload.old.id) ?? []
          );
          queryClient.invalidateQueries({ queryKey: ["reply-counts", channelId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `parent_id=eq.${parentId}`,
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
            ["thread", parentId],
            (old) => old?.map((m) => (m.id === message.id ? message : m)) ?? []
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentId, channelId, queryClient, supabase]);
}
