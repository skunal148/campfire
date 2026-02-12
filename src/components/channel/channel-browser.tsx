"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBrowsableChannels, type BrowsableChannel } from "@/lib/actions/channels";
import { useJoinChannel } from "@/lib/hooks/use-channel-mutations";

export function ChannelBrowser() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [channels, setChannels] = useState<BrowsableChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { mutate: join, isPending: isJoining } = useJoinChannel();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getBrowsableChannels()
        .then(setChannels)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const filtered = channels.filter((ch) =>
    ch.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = (channelId: string) => {
    join(channelId, {
      onSuccess: () => {
        // Refresh list to update is_member
        getBrowsableChannels().then(setChannels);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="sidebar-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>Browse channels</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-[#2b2d31] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Browse channels</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels"
              className="w-full rounded-md border border-border bg-[#1e1f22] py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-[300px]">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No channels found
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 transition-colors duration-100 hover:bg-[#3f4147]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {ch.name}
                        </span>
                      </div>
                      {ch.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate pl-5">
                          {ch.description}
                        </p>
                      )}
                    </div>
                    {ch.is_member ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOpen(false);
                          router.push(`/channel/${ch.id}`);
                        }}
                        className="shrink-0 text-xs"
                      >
                        Open
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoin(ch.id)}
                        disabled={isJoining}
                        className="shrink-0 text-xs"
                      >
                        Join
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
