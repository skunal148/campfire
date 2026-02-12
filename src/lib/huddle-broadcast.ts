"use client";

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CHANNEL_NAME = "workspace:huddles";

let channel: RealtimeChannel | null = null;
let ready = false;
let listeners: Array<(payload: any) => void> = [];

function ensureChannel() {
  if (channel) return channel;

  const supabase = createClient();
  channel = supabase.channel(CHANNEL_NAME);

  channel
    .on("broadcast", { event: "huddle_started" }, (msg) => {
      for (const listener of listeners) {
        listener(msg.payload);
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ready = true;
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        ready = false;
      }
    });

  return channel;
}

export function addHuddleListener(fn: (payload: any) => void) {
  ensureChannel();
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function broadcastHuddleStarted(payload: {
  channelId: string;
  startedBy: string;
  displayName: string;
  targetUserIds: string[];
}) {
  const ch = ensureChannel();
  if (ready) {
    ch.send({
      type: "broadcast",
      event: "huddle_started",
      payload,
    });
  } else {
    // Retry after channel subscribes
    const check = setInterval(() => {
      if (ready) {
        clearInterval(check);
        ch.send({
          type: "broadcast",
          event: "huddle_started",
          payload,
        });
      }
    }, 500);
    // Give up after 5 seconds
    setTimeout(() => clearInterval(check), 5000);
  }
}
