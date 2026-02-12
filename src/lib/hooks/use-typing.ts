"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TypingUser } from "@/lib/types/database";

const TYPING_TIMEOUT = 3000;

export function useTypingIndicator(
  channelId: string,
  userId: string | undefined,
  displayName: string | undefined
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const supabase = createClient();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`typing:${channelId}`);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId: typerId, displayName: typerName } = payload.payload as TypingUser;
        if (typerId === userId) return;

        // Clear existing timer for this user
        const existing = timersRef.current.get(typerId);
        if (existing) clearTimeout(existing);

        // Add/update typing user
        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.userId !== typerId);
          return [...filtered, { userId: typerId, displayName: typerName }];
        });

        // Set removal timer
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== typerId));
          timersRef.current.delete(typerId);
        }, TYPING_TIMEOUT);
        timersRef.current.set(typerId, timer);
      })
      .subscribe();

    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      supabase.removeChannel(channel);
    };
  }, [channelId, userId, supabase]);

  const broadcastTyping = useCallback(() => {
    if (!userId || !displayName) return;

    supabase.channel(`typing:${channelId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId, displayName },
    });
  }, [channelId, userId, displayName, supabase]);

  return { typingUsers, broadcastTyping };
}
