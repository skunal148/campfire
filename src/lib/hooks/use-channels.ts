"use client";

import { useQuery } from "@tanstack/react-query";
import { getChannels, getChannel } from "@/lib/actions/channels";
import type { Channel } from "@/lib/types/database";

export function useChannels(initialData?: Channel[]) {
  return useQuery({
    queryKey: ["channels"],
    queryFn: getChannels,
    initialData,
  });
}

export function useChannel(channelId: string, initialData?: Channel) {
  return useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => getChannel(channelId),
    initialData,
  });
}
