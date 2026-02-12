"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { HuddleParticipant } from "@/lib/types/database";

interface UseHuddlePresenceOptions {
  channelId: string | null;
  userId: string;
  /** When provided, auto-tracks this participant once subscribed */
  self?: HuddleParticipant | null;
}

export function useHuddlePresence({ channelId, userId, self }: UseHuddlePresenceOptions) {
  const [participants, setParticipants] = useState<HuddleParticipant[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const selfRef = useRef(self);
  selfRef.current = self;
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable supabase client ref
  const supabaseRef = useRef(createClient());

  // Create channel + subscribe — stable per channelId + userId
  useEffect(() => {
    if (!channelId) {
      setParticipants([]);
      return;
    }

    const supabase = supabaseRef.current;
    subscribedRef.current = false;

    const presenceChannel = supabase.channel(`huddle:${channelId}`, {
      config: { presence: { key: userId } },
    });

    const syncHandler = () => {
      const state = presenceChannel.presenceState();
      const allParticipants: HuddleParticipant[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences as any[]) {
          if (p.userId) {
            allParticipants.push({
              userId: p.userId,
              displayName: p.displayName,
              avatarUrl: p.avatarUrl ?? null,
              audioEnabled: p.audioEnabled ?? true,
              videoEnabled: p.videoEnabled ?? false,
              screenShareEnabled: p.screenShareEnabled ?? false,
              joinedAt: p.joinedAt,
            });
          }
        }
      }
      setParticipants(allParticipants);
    };

    const trackSelf = async () => {
      const currentSelf = selfRef.current;
      if (currentSelf) {
        try {
          await presenceChannel.track(currentSelf);
        } catch {
          // Track failed, will retry
        }
      }
    };

    presenceChannel
      .on("presence", { event: "sync" }, syncHandler)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          subscribedRef.current = true;
          await trackSelf();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          subscribedRef.current = false;
          // Supabase auto-reconnects; we'll re-track on next SUBSCRIBED
        }
      });

    channelRef.current = presenceChannel;

    // Periodic re-track heartbeat: ensures presence survives brief disconnections
    const heartbeat = setInterval(() => {
      if (subscribedRef.current && selfRef.current && channelRef.current) {
        channelRef.current.track(selfRef.current).catch(() => {});
      }
    }, 15000);

    return () => {
      clearInterval(heartbeat);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      subscribedRef.current = false;
      supabase.removeChannel(presenceChannel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, userId]);

  // Track/untrack when self changes after channel is subscribed
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch) return;

    const doTrack = async () => {
      if (self) {
        if (subscribedRef.current) {
          try {
            await ch.track(self);
          } catch {
            // Retry once after a short delay
            retryTimerRef.current = setTimeout(() => {
              if (subscribedRef.current && selfRef.current) {
                ch.track(selfRef.current).catch(() => {});
              }
            }, 2000);
          }
        }
      } else {
        if (subscribedRef.current) {
          ch.untrack().catch(() => {});
        }
      }
    };
    doTrack();
  }, [self]);

  const updatePresence = useCallback(
    async (updates: Partial<HuddleParticipant>) => {
      if (!channelRef.current || !subscribedRef.current) return;
      const state = channelRef.current.presenceState();
      const allPresences = Object.values(state).flat() as any[];
      const current = allPresences.find(
        (p) => p.userId === updates.userId
      );
      if (current) {
        await channelRef.current.track({ ...current, ...updates });
      }
    },
    []
  );

  const leavePresence = useCallback(async () => {
    if (!channelRef.current) return;
    await channelRef.current.untrack();
  }, []);

  return { participants, leavePresence, updatePresence };
}
