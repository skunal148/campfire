"use client";

import { useCallback, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  RoomOptions,
} from "livekit-client";
import { generateHuddleToken } from "@/lib/actions/huddles";

interface UseHuddleReturn {
  room: Room | null;
  isConnecting: boolean;
  error: string | null;
  connect: (channelId: string) => Promise<void>;
  disconnect: () => void;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenShareEnabled: boolean;
}

export function useHuddle(): UseHuddleReturn {
  const roomRef = useRef<Room | null>(null);
  // Track the room during connection so disconnect() can abort mid-connect
  const pendingRoomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);
  const abortedRef = useRef(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  const connect = useCallback(async (channelId: string) => {
    // Prevent concurrent connects (React Strict Mode calls effects twice)
    if (roomRef.current || connectingRef.current) return;
    connectingRef.current = true;
    abortedRef.current = false;
    setIsConnecting(true);
    setError(null);

    try {
      const { token } = await generateHuddleToken(channelId);

      // Check if disconnect was called while we were fetching the token
      if (abortedRef.current) return;

      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!livekitUrl) throw new Error("LiveKit URL not configured");

      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        disconnectOnPageLeave: true,
      };

      const newRoom = new Room(roomOptions);
      pendingRoomRef.current = newRoom;

      newRoom.on(RoomEvent.Disconnected, () => {
        roomRef.current = null;
        pendingRoomRef.current = null;
        setRoom(null);
        setIsAudioEnabled(true);
        setIsVideoEnabled(false);
        setIsScreenShareEnabled(false);
      });

      await newRoom.connect(livekitUrl, token);

      // Check if disconnect was called while we were connecting
      if (abortedRef.current) {
        newRoom.disconnect();
        return;
      }

      await newRoom.localParticipant.setMicrophoneEnabled(true);

      // Final abort check
      if (abortedRef.current) {
        newRoom.disconnect();
        return;
      }

      roomRef.current = newRoom;
      pendingRoomRef.current = null;
      setRoom(newRoom);
      setIsAudioEnabled(true);
    } catch (err) {
      if (!abortedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to connect");
      }
      roomRef.current = null;
      pendingRoomRef.current = null;
      setRoom(null);
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Signal any in-progress connect to abort
    abortedRef.current = true;

    // Disconnect pending room (mid-connection)
    if (pendingRoomRef.current) {
      try { pendingRoomRef.current.disconnect(); } catch {}
      pendingRoomRef.current = null;
    }

    // Disconnect established room
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    connectingRef.current = false;
    setRoom(null);
    setIsConnecting(false);
    setIsAudioEnabled(true);
    setIsVideoEnabled(false);
    setIsScreenShareEnabled(false);
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
    setIsAudioEnabled(!enabled);
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isCameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(!enabled);
    setIsVideoEnabled(!enabled);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = roomRef.current.localParticipant.isScreenShareEnabled;
    await roomRef.current.localParticipant.setScreenShareEnabled(!enabled);
    setIsScreenShareEnabled(!enabled);
  }, []);

  return {
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
  };
}
