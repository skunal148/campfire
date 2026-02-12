"use client";

import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePresenceContext } from "@/components/presence-provider";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { HuddleTrigger } from "@/components/huddle/huddle-trigger";
import type { Profile } from "@/lib/types/database";

interface DMHeaderProps {
  otherUser: Profile;
  channelId: string;
  currentUserId: string;
  huddleParticipantCount: number;
}

export function DMHeader({ otherUser, channelId, currentUserId, huddleParticipantCount }: DMHeaderProps) {
  const { isOnline } = usePresenceContext();
  const online = isOnline(otherUser.id);
  const openGlobalSearch = useWorkspaceStore((s) => s.openGlobalSearch);

  return (
    <div className="flex h-12 items-center gap-2 border-b border-border px-4">
      <div className="relative">
        <Avatar size="sm">
          {otherUser.avatar_url && <AvatarImage src={otherUser.avatar_url} />}
          <AvatarFallback>
            {otherUser.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {online && (
          <span className="online-dot absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#222529] bg-green-500" />
        )}
      </div>
      <h2 className="text-sm font-semibold text-foreground">
        {otherUser.display_name}
      </h2>
      {online ? (
        <span className="text-xs text-green-400">Active</span>
      ) : (
        <span className="text-xs text-muted-foreground">Away</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <HuddleTrigger channelId={channelId} currentUserId={currentUserId} huddleParticipantCount={huddleParticipantCount} />
        <button
          onClick={openGlobalSearch}
          className="rounded p-1.5 text-muted-foreground transition-all duration-150 hover:bg-[#3f4147] hover:text-foreground hover:scale-105 active:scale-95"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
