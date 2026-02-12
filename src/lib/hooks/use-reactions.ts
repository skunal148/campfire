"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReactions, toggleReaction } from "@/lib/actions/reactions";
import type { Reaction, ReactionGroup } from "@/lib/types/database";

export function useReactions(messageId: string) {
  return useQuery({
    queryKey: ["reactions", messageId],
    queryFn: () => getReactions(messageId),
    select: (reactions: Reaction[]): ReactionGroup[] => {
      const map = new Map<string, { count: number; userIds: string[] }>();
      for (const r of reactions) {
        const entry = map.get(r.emoji) ?? { count: 0, userIds: [] };
        entry.count++;
        entry.userIds.push(r.user_id);
        map.set(r.emoji, entry);
      }
      return Array.from(map, ([emoji, { count, userIds }]) => ({
        emoji,
        count,
        userIds,
      }));
    },
  });
}

export function useToggleReaction(messageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emoji: string) => toggleReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", messageId] });
    },
  });
}
