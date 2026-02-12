"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchMessages,
  searchChannels,
  searchUsers,
} from "@/lib/actions/search";

export function useSearchMessages(query: string, channelId?: string) {
  return useQuery({
    queryKey: ["search-messages", query, channelId],
    queryFn: () => searchMessages(query, channelId),
    enabled: query.length >= 2,
  });
}

export function useSearchChannels(query: string) {
  return useQuery({
    queryKey: ["search-channels", query],
    queryFn: () => searchChannels(query),
    enabled: query.length >= 1,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["search-users", query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 1,
  });
}
