"use client";

import { useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Minimize2,
  Maximize2,
  PhoneOff,
} from "lucide-react";
import { useHuddle } from "@/lib/hooks/use-huddle";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { getChannelMembers } from "@/lib/actions/channels";
import { broadcastHuddleStarted } from "@/lib/huddle-broadcast";
import { HuddleVideoGrid } from "./huddle-video-grid";
import type { HuddleParticipant } from "@/lib/types/database";

interface HuddleBarProps {
  channelId: string;
  currentUserId: string;
  currentDisplayName: string;
  currentAvatarUrl: string | null;
  participants: HuddleParticipant[];
  leavePresence: () => Promise<void>;
  updatePresence: (updates: Partial<HuddleParticipant>) => Promise<void>;
}

export function HuddleBar({
  channelId,
  currentUserId,
  currentDisplayName,
  currentAvatarUrl,
  participants,
  leavePresence,
  updatePresence,
}: HuddleBarProps) {
  const {
    room,
    isConnecting,
    error,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isScreenShareEnabled,
  } = useHuddle();

  const leaveHuddle = useWorkspaceStore((s) => s.leaveHuddle);
  const isHuddleMinimized = useWorkspaceStore((s) => s.isHuddleMinimized);
  const toggleHuddleMinimized = useWorkspaceStore((s) => s.toggleHuddleMinimized);

  // Connect to LiveKit room on mount — Strict Mode safe
  // disconnect() now properly aborts in-progress connections
  useEffect(() => {
    connect(channelId);
    return () => { disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Broadcast huddle start notification to channel members (once)
  const broadcastedRef = useRef(false);
  useEffect(() => {
    if (broadcastedRef.current) return;
    broadcastedRef.current = true;

    (async () => {
      try {
        const members = await getChannelMembers(channelId);

        const targetUserIds = members
          .map((m) => m.user_id)
          .filter((id) => id !== currentUserId);

        if (targetUserIds.length === 0) return;

        broadcastHuddleStarted({
          channelId,
          startedBy: currentUserId,
          displayName: currentDisplayName,
          targetUserIds,
        });
      } catch {
        // Non-critical: notification failed, huddle still works
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const handleToggleAudio = async () => {
    await toggleAudio();
    await updatePresence({
      userId: currentUserId,
      audioEnabled: !isAudioEnabled,
    });
  };

  const handleToggleVideo = async () => {
    await toggleVideo();
    await updatePresence({
      userId: currentUserId,
      videoEnabled: !isVideoEnabled,
    });
  };

  const handleToggleScreenShare = async () => {
    await toggleScreenShare();
    await updatePresence({
      userId: currentUserId,
      screenShareEnabled: !isScreenShareEnabled,
    });
  };

  const handleLeave = () => {
    disconnect();
    leavePresence();
    leaveHuddle();
  };

  return (
    <>
      {/* Full-screen video grid (when expanded) */}
      {room && !isHuddleMinimized && (
        <HuddleVideoGrid room={room} />
      )}

      {/* Floating control bar */}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border/60 bg-[#1a1d21]/95 px-4 py-2.5 shadow-2xl shadow-black/40 backdrop-blur-md animate-fade-in-up">
        {isConnecting ? (
          <span className="text-sm text-muted-foreground">Connecting...</span>
        ) : (
          <>
            {/* Participant count — always visible */}
            <span className="mr-1 text-xs text-green-400">
              {participants.length} in huddle
            </span>

            <div className="mx-1 h-5 w-px bg-border" />

            {error ? (
              <>
                <span className="text-xs text-yellow-400">Audio unavailable</span>
                <div className="mx-1 h-5 w-px bg-border" />
              </>
            ) : (
              <>
                {/* Mic toggle */}
                <button
                  onClick={handleToggleAudio}
                  className={`rounded-lg p-2 transition-all duration-150 hover:scale-105 active:scale-95 ${
                    isAudioEnabled
                      ? "text-foreground hover:bg-[#3f4147]"
                      : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  }`}
                  title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                  {isAudioEnabled ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                </button>

                {/* Video toggle */}
                <button
                  onClick={handleToggleVideo}
                  className={`rounded-lg p-2 transition-all duration-150 hover:scale-105 active:scale-95 ${
                    isVideoEnabled
                      ? "text-foreground hover:bg-[#3f4147]"
                      : "text-muted-foreground hover:bg-[#3f4147] hover:text-foreground"
                  }`}
                  title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoEnabled ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <VideoOff className="h-4 w-4" />
                  )}
                </button>

                {/* Screen share toggle */}
                <button
                  onClick={handleToggleScreenShare}
                  className={`rounded-lg p-2 transition-all duration-150 hover:scale-105 active:scale-95 ${
                    isScreenShareEnabled
                      ? "text-green-400 hover:bg-[#3f4147]"
                      : "text-muted-foreground hover:bg-[#3f4147] hover:text-foreground"
                  }`}
                  title={isScreenShareEnabled ? "Stop sharing" : "Share screen"}
                >
                  <Monitor className="h-4 w-4" />
                </button>

                <div className="mx-1 h-5 w-px bg-border/50" />

                {/* Minimize/Expand */}
                <button
                  onClick={toggleHuddleMinimized}
                  className="rounded-lg p-2 text-muted-foreground transition-all duration-150 hover:bg-[#3f4147] hover:text-foreground hover:scale-105 active:scale-95"
                  title={isHuddleMinimized ? "Expand" : "Minimize"}
                >
                  {isHuddleMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </button>

                <div className="mx-1 h-5 w-px bg-border/50" />
              </>
            )}

            {/* Leave */}
            <button
              onClick={handleLeave}
              className="rounded-lg bg-red-600 p-2 text-white transition-all duration-150 hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/30 hover:scale-105 active:scale-95"
              title="Leave huddle"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </>
  );
}
