"use client";

import { Headphones } from "lucide-react";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import type { HuddleParticipant } from "@/lib/types/database";

interface HuddleJoinBannerProps {
  channelId: string;
  participants: HuddleParticipant[];
}

export function HuddleJoinBanner({ channelId, participants }: HuddleJoinBannerProps) {
  const startHuddle = useWorkspaceStore((s) => s.startHuddle);
  const activeHuddleChannelId = useWorkspaceStore((s) => s.activeHuddleChannelId);

  const isInThisHuddle = activeHuddleChannelId === channelId;
  const isInAnotherHuddle = activeHuddleChannelId !== null && !isInThisHuddle;

  // Don't show if no active huddle, or user is already in this huddle
  if (participants.length === 0 || isInThisHuddle) return null;

  const names = participants.map((p) => p.displayName);
  const summary =
    names.length === 1
      ? `${names[0]} started a huddle`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are in a huddle`
        : `${names[0]} and ${names.length - 1} others are in a huddle`;

  return (
    <div className="mx-4 mb-1 flex items-center gap-3 rounded-lg border border-green-800/40 bg-green-950/25 px-4 py-2.5 animate-fade-in-up backdrop-blur-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600/20">
        <Headphones className="h-4 w-4 text-green-400" />
      </div>
      <p className="flex-1 text-sm text-green-300">{summary}</p>
      <button
        onClick={() => startHuddle(channelId)}
        disabled={isInAnotherHuddle}
        className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-green-500 hover:shadow-lg hover:shadow-green-600/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        title={isInAnotherHuddle ? "Leave your current huddle first" : "Join huddle"}
      >
        Join
      </button>
    </div>
  );
}
