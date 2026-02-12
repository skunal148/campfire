"use client";

import { useState } from "react";
import { Hash, Pin, Search, Settings } from "lucide-react";
import { usePinnedMessages } from "@/lib/hooks/use-pins";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { PinnedMessagesPanel } from "./pinned-messages-panel";
import { HuddleTrigger } from "@/components/huddle/huddle-trigger";
import type { Channel } from "@/lib/types/database";

interface ChannelHeaderProps {
  channel: Channel;
  currentUserId: string;
  huddleParticipantCount: number;
  onOpenSettings: () => void;
}

export function ChannelHeader({ channel, currentUserId, huddleParticipantCount, onOpenSettings }: ChannelHeaderProps) {
  const [pinsOpen, setPinsOpen] = useState(false);
  const { data: pins } = usePinnedMessages(channel.id);
  const openGlobalSearch = useWorkspaceStore((s) => s.openGlobalSearch);
  const pinCount = pins?.length ?? 0;

  return (
    <>
      <div className="flex h-12 items-center border-b border-border px-4">
        <div className="flex items-center gap-1">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{channel.name}</h2>
        </div>
        {channel.description && (
          <>
            <span className="mx-2 text-border">|</span>
            <p className="truncate text-xs text-muted-foreground">{channel.description}</p>
          </>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => setPinsOpen(true)}
            className="relative flex items-center gap-1 rounded p-1.5 text-muted-foreground transition-all duration-150 hover:bg-[#3f4147] hover:text-foreground hover:scale-105 active:scale-95"
            title="Pinned messages"
          >
            <Pin className="h-4 w-4" />
            {pinCount > 0 && (
              <span className="text-[10px] font-medium text-primary">{pinCount}</span>
            )}
          </button>
          <HuddleTrigger channelId={channel.id} currentUserId={currentUserId} huddleParticipantCount={huddleParticipantCount} />
          <button
            onClick={onOpenSettings}
            className="rounded p-1.5 text-muted-foreground transition-all duration-150 hover:bg-[#3f4147] hover:text-foreground hover:scale-105 active:scale-95"
            title="Channel settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={openGlobalSearch}
            className="rounded p-1.5 text-muted-foreground transition-all duration-150 hover:bg-[#3f4147] hover:text-foreground hover:scale-105 active:scale-95"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
      <PinnedMessagesPanel
        channelId={channel.id}
        open={pinsOpen}
        onOpenChange={setPinsOpen}
      />
    </>
  );
}
