"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, ChevronDown } from "lucide-react";
import type { Channel } from "@/lib/types/database";
import { useChannels } from "@/lib/hooks/use-channels";
import { useUnreadCounts } from "@/lib/hooks/use-unreads";
import { CreateChannelDialog } from "@/components/channel/create-channel-dialog";
import { ChannelBrowser } from "@/components/channel/channel-browser";

interface ChannelListProps {
  channels: Channel[];
}

export function ChannelList({ channels: initialChannels }: ChannelListProps) {
  const { data: channels } = useChannels(initialChannels);
  const { data: unreads } = useUnreadCounts();
  const pathname = usePathname();

  const unreadMap = new Map(
    unreads?.map((u) => [u.channel_id, u.unread_count]) ?? []
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Channels
          </span>
        </div>
        <CreateChannelDialog />
      </div>
      <div className="space-y-px">
        {channels?.map((channel) => {
          const isActive = pathname === `/channel/${channel.id}`;
          const unreadCount = unreadMap.get(channel.id) ?? 0;
          return (
            <Link
              key={channel.id}
              href={`/channel/${channel.id}`}
              className={`sidebar-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                isActive
                  ? "bg-primary/20 text-white font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Hash className={`h-4 w-4 ${isActive ? "text-white/60" : "text-muted-foreground/60"}`} />
              <span className={`truncate ${unreadCount > 0 && !isActive ? "font-semibold text-white" : ""}`}>
                {channel.name}
              </span>
              {unreadCount > 0 && !isActive && (
                <span className="unread-badge ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        <ChannelBrowser />
      </div>
    </div>
  );
}
