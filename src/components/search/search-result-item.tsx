"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Hash } from "lucide-react";
import type { SearchResult } from "@/lib/types/database";

function formatSearchTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
}

export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const initials = result.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-[#3f4147] transition-colors"
    >
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {result.display_name}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Hash className="h-2.5 w-2.5" />
            {result.channel_name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatSearchTime(result.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-foreground/80 line-clamp-2 break-words">
          {result.content}
        </p>
      </div>
    </button>
  );
}
