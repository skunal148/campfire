"use client";

import {
  RoomContext,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
  TrackRefContext,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track, type Room } from "livekit-client";
import "@livekit/components-styles";

interface HuddleVideoGridProps {
  room: Room;
}

function VideoGrid() {
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  const hasScreenShare = screenTracks.length > 0;

  if (cameraTracks.length === 0 && screenTracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Waiting for participants...
      </div>
    );
  }

  // Screen share active → focus layout: screen share fills center, participants in sidebar
  if (hasScreenShare) {
    return (
      <div className="flex h-full gap-2 p-3">
        {/* Main screen share area */}
        <div className="flex-1 overflow-hidden rounded-lg bg-black">
          {screenTracks.map((track) => (
            <TrackRefContext.Provider
              key={`${track.participant.identity}-screen`}
              value={track as TrackReferenceOrPlaceholder}
            >
              <ParticipantTile style={{ height: "100%" }} />
            </TrackRefContext.Provider>
          ))}
        </div>

        {/* Participant sidebar */}
        <div className="flex w-48 flex-shrink-0 flex-col gap-2 overflow-y-auto">
          {cameraTracks.map((track) => (
            <div
              key={track.participant.identity}
              className="aspect-video w-full overflow-hidden rounded-lg bg-[#1a1d21]"
            >
              <TrackRefContext.Provider
                value={track as TrackReferenceOrPlaceholder}
              >
                <ParticipantTile style={{ height: "100%" }} />
              </TrackRefContext.Provider>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No screen share → equal grid of camera feeds
  const allTracks = [...cameraTracks];
  return (
    <GridLayout
      tracks={allTracks}
      style={{ height: "100%", padding: "1rem", gap: "0.5rem" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}

export function HuddleVideoGrid({ room }: HuddleVideoGridProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0e0e10]">
      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        {/* Main grid area — leave space at bottom for the control bar */}
        <div className="flex-1 overflow-hidden pb-16">
          <VideoGrid />
        </div>
      </RoomContext.Provider>
    </div>
  );
}
