"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

interface NotificationProviderProps {
  userId?: string;
  children: React.ReactNode;
}

export function NotificationProvider({ userId, children }: NotificationProviderProps) {
  const { showNotification, requestPermission } = useNotifications();

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Message notifications only — huddle notifications handled by HuddleNotification
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as {
            id: string;
            channel_id: string;
            user_id: string;
            content: string;
            parent_id: string | null;
          };

          // Don't notify for own messages
          if (msg.user_id === userId) return;

          // Don't notify if viewing that channel
          const activeChannelId = useWorkspaceStore.getState().activeChannelId;
          if (msg.channel_id === activeChannelId && !document.hidden) return;

          showNotification(
            "New message",
            msg.content.length > 100
              ? msg.content.slice(0, 100) + "..."
              : msg.content,
            `/channel/${msg.channel_id}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showNotification]);

  return <>{children}</>;
}
