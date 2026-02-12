"use client";

import { useEffect, useMemo } from "react";
import { DMHeader } from "./dm-header";
import { MessageList } from "@/components/channel/message-list";
import { MessageInput } from "@/components/channel/message-input";
import { ThreadPanel } from "@/components/channel/thread-panel";
import { TypingIndicator } from "@/components/channel/typing-indicator";
import { useMessages } from "@/lib/hooks/use-messages";
import { useRealtimeMessages } from "@/lib/hooks/use-realtime-messages";
import { useRealtimeReactions } from "@/lib/hooks/use-realtime-reactions";
import { useReplyCounts } from "@/lib/hooks/use-thread";
import { useTypingIndicator } from "@/lib/hooks/use-typing";
import { useMarkRead } from "@/lib/hooks/use-unreads";
import { useHuddlePresence } from "@/lib/hooks/use-huddle-presence";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { HuddleBar } from "@/components/huddle/huddle-bar";
import { HuddleJoinBanner } from "@/components/huddle/huddle-join-banner";
import type { Channel, MessageWithAuthor, Profile, HuddleParticipant } from "@/lib/types/database";

interface DMViewProps {
  channel: Channel;
  otherUser: Profile;
  initialMessages: MessageWithAuthor[];
  currentUserId: string;
  currentDisplayName: string;
  currentAvatarUrl: string | null;
}

export function DMView({
  channel,
  otherUser,
  initialMessages,
  currentUserId,
  currentDisplayName,
  currentAvatarUrl,
}: DMViewProps) {
  const { data: messages } = useMessages(channel.id, initialMessages);
  const { data: replyCounts } = useReplyCounts(channel.id);
  const { typingUsers, broadcastTyping } = useTypingIndicator(
    channel.id,
    currentUserId,
    currentDisplayName
  );
  const { mutate: markRead } = useMarkRead();

  const setActiveChannelId = useWorkspaceStore((s) => s.setActiveChannelId);

  useRealtimeMessages(channel.id);
  useRealtimeReactions(channel.id);

  useEffect(() => {
    markRead(channel.id);
    setActiveChannelId(channel.id);
    return () => setActiveChannelId(null);
  }, [channel.id, markRead, setActiveChannelId]);

  const activeHuddleChannelId = useWorkspaceStore((s) => s.activeHuddleChannelId);
  const isInHuddle = activeHuddleChannelId === channel.id;

  // Single presence subscription for this channel — shared by trigger + bar
  const self = useMemo<HuddleParticipant | null>(
    () =>
      isInHuddle
        ? {
            userId: currentUserId,
            displayName: currentDisplayName,
            avatarUrl: currentAvatarUrl,
            audioEnabled: true,
            videoEnabled: false,
            screenShareEnabled: false,
            joinedAt: new Date().toISOString(),
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isInHuddle, currentUserId]
  );

  const { participants, leavePresence, updatePresence } = useHuddlePresence({
    channelId: channel.id,
    userId: currentUserId,
    self,
  });

  const threadMessageId = useWorkspaceStore((s) => s.threadMessageId);
  const openThread = useWorkspaceStore((s) => s.openThread);
  const closeThread = useWorkspaceStore((s) => s.closeThread);

  const parentMessage =
    threadMessageId && messages
      ? messages.find((m) => m.id === threadMessageId) ?? null
      : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col">
        <DMHeader
          otherUser={otherUser}
          channelId={channel.id}
          currentUserId={currentUserId}
          huddleParticipantCount={participants.length}
        />
        <MessageList
          messages={messages ?? []}
          channelId={channel.id}
          currentUserId={currentUserId}
          replyCounts={replyCounts ?? {}}
          onOpenThread={openThread}
        />
        <TypingIndicator typingUsers={typingUsers} />
        <HuddleJoinBanner channelId={channel.id} participants={participants} />
        <MessageInput
          channelId={channel.id}
          channelName={otherUser.display_name}
          onTyping={broadcastTyping}
        />
      </div>
      {parentMessage && (
        <ThreadPanel
          parentMessage={parentMessage}
          channelId={channel.id}
          currentUserId={currentUserId}
          onClose={closeThread}
        />
      )}
      {isInHuddle && (
        <HuddleBar
          channelId={channel.id}
          currentUserId={currentUserId}
          currentDisplayName={currentDisplayName}
          currentAvatarUrl={currentAvatarUrl}
          participants={participants}
          leavePresence={leavePresence}
          updatePresence={updatePresence}
        />
      )}
    </div>
  );
}
