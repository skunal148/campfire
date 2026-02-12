"use client";

import { SmilePlus } from "lucide-react";
import { useReactions, useToggleReaction } from "@/lib/hooks/use-reactions";
import { EmojiPicker } from "./emoji-picker";
import type { ReactionGroup } from "@/lib/types/database";

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

export function MessageReactions({ messageId, currentUserId }: MessageReactionsProps) {
  const { data: groups } = useReactions(messageId);
  const { mutate: toggle } = useToggleReaction(messageId);

  if (!groups || groups.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {groups.map((g: ReactionGroup) => {
        const hasReacted = g.userIds.includes(currentUserId);
        return (
          <button
            key={g.emoji}
            onClick={() => toggle(g.emoji)}
            className={`reaction-btn inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
              hasReacted
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-[#2b2d31] text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            <span>{g.emoji}</span>
            <span>{g.count}</span>
          </button>
        );
      })}
      <EmojiPicker onSelect={(emoji) => toggle(emoji)}>
        <button className="reaction-btn inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-[#2b2d31] text-muted-foreground hover:border-muted-foreground">
          <SmilePlus className="h-3 w-3" />
        </button>
      </EmojiPicker>
    </div>
  );
}
