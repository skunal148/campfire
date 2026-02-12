"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeReactions(channelId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
        },
        (payload) => {
          const messageId =
            (payload.new as { message_id?: string })?.message_id ??
            (payload.old as { message_id?: string })?.message_id;
          if (messageId) {
            queryClient.invalidateQueries({ queryKey: ["reactions", messageId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient, supabase]);
}
