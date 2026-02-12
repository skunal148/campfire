"use client";

import { Headphones } from "lucide-react";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

interface HuddleTriggerProps {
  channelId: string;
  currentUserId: string;
  huddleParticipantCount: number;
}

export function HuddleTrigger({ channelId, currentUserId, huddleParticipantCount }: HuddleTriggerProps) {
  const activeHuddleChannelId = useWorkspaceStore((s) => s.activeHuddleChannelId);
  const startHuddle = useWorkspaceStore((s) => s.startHuddle);

  const isInThisHuddle = activeHuddleChannelId === channelId;
  const isInAnyHuddle = activeHuddleChannelId !== null;
  const hasActiveHuddle = huddleParticipantCount > 0;

  const handleClick = () => {
    if (isInThisHuddle) return;
    if (isInAnyHuddle) return;
    startHuddle(channelId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isInAnyHuddle && !isInThisHuddle}
      className={`relative flex items-center gap-1 rounded p-1.5 transition-all duration-150 hover:scale-105 active:scale-95 ${
        isInThisHuddle
          ? "bg-green-600/20 text-green-400 animate-glow-pulse"
          : hasActiveHuddle
            ? "text-green-400 hover:bg-[#3f4147]"
            : "text-muted-foreground hover:bg-[#3f4147] hover:text-foreground"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      title={
        isInThisHuddle
          ? "In huddle"
          : isInAnyHuddle
            ? "Leave current huddle first"
            : hasActiveHuddle
              ? `Join huddle (${huddleParticipantCount})`
              : "Start huddle"
      }
    >
      <Headphones className="h-4 w-4" />
      {hasActiveHuddle && (
        <span className="text-[10px] font-medium">{huddleParticipantCount}</span>
      )}
    </button>
  );
}
