"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchMessages } from "@/lib/hooks/use-search";
import { SearchResultItem } from "./search-result-item";
import { useRouter } from "next/navigation";

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

interface ChannelSearchBarProps {
  channelId: string;
  onClose: () => void;
}

export function ChannelSearchBar({ channelId, onClose }: ChannelSearchBarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { data: results } = useSearchMessages(debouncedQuery, channelId);
  const router = useRouter();

  return (
    <div className="relative border-b border-border bg-[#1e1f22] px-4 py-2">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in this channel..."
          className="bg-[#2b2d31] border-border text-sm"
          autoFocus
        />
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {results && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 border-b border-border bg-[#1e1f22] shadow-lg">
          <ScrollArea className="max-h-[300px]">
            {results.map((r) => (
              <SearchResultItem
                key={r.id}
                result={r}
                onClick={() => {
                  onClose();
                  router.push(`/channel/${r.channel_id}`);
                }}
              />
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
