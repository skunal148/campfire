"use client";

import { formatDateSeparator } from "@/lib/utils/format";

interface DateSeparatorProps {
  dateStr: string;
}

export function DateSeparator({ dateStr }: DateSeparatorProps) {
  return (
    <div className="relative flex items-center py-2 animate-fade-in">
      <div className="flex-1 border-t border-border/60" />
      <span className="mx-4 rounded-full border border-border/60 bg-[#1e1f22] px-3 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground shadow-sm">
        {formatDateSeparator(dateStr)}
      </span>
      <div className="flex-1 border-t border-border/60" />
    </div>
  );
}
