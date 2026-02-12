"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversations } from "@/lib/hooks/use-conversations";
import { useUnreadCounts } from "@/lib/hooks/use-unreads";
import { usePresenceContext } from "@/components/presence-provider";
import { NewDMDialog } from "./new-dm-dialog";
import type { Conversation } from "@/lib/types/database";

interface DMListProps {
  conversations: Conversation[];
}

export function DMList({ conversations: initialConversations }: DMListProps) {
  const { data: conversations } = useConversations(initialConversations);
  const { data: unreads } = useUnreadCounts();
  const { isOnline } = usePresenceContext();
  const pathname = usePathname();

  const unreadMap = new Map(
    unreads?.map((u) => [u.channel_id, u.unread_count]) ?? []
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Direct Messages
          </span>
        </div>
        <NewDMDialog />
      </div>
      <div className="space-y-0.5">
        {conversations?.map((convo) => {
          const isActive = pathname === `/dm/${convo.channel_id}`;
          const unreadCount = unreadMap.get(convo.channel_id) ?? 0;
          const online = isOnline(convo.other_user_id);

          return (
            <Link
              key={convo.channel_id}
              href={`/dm/${convo.channel_id}`}
              className={`sidebar-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                isActive
                  ? "bg-primary/20 text-white font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar size="sm">
                  {convo.avatar_url && <AvatarImage src={convo.avatar_url} />}
                  <AvatarFallback>
                    {convo.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {online && (
                  <span className="online-dot absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1a1d21] bg-green-500" />
                )}
              </div>
              <span className={`truncate ${unreadCount > 0 && !isActive ? "font-semibold text-white" : ""}`}>
                {convo.display_name}
              </span>
              {unreadCount > 0 && !isActive && (
                <span className="unread-badge ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
