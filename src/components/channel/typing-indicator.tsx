"use client";

import type { TypingUser } from "@/lib/types/database";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return <div className="h-4 shrink-0 px-4" />;
  }

  const names = typingUsers.map((u) => u.displayName);
  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = "Several people are typing";
  }

  return (
    <div className="flex h-5 shrink-0 items-center gap-1.5 px-4">
      <span className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce-dots" style={{ animationDelay: "0s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce-dots" style={{ animationDelay: "0.16s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce-dots" style={{ animationDelay: "0.32s" }} />
      </span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
