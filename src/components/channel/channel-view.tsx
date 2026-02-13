"use client";

import { useEffect, useMemo, useState } from "react";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadPanel } from "./thread-panel";
import { TypingIndicator } from "./typing-indicator";
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
import { ChannelSettingsPanel } from "./channel-settings-panel";
import type { Channel, MessageWithAuthor, HuddleParticipant } from "@/lib/types/database";

interface ChannelViewProps {
  channel: Channel;
  initialMessages: MessageWithAuthor[];
  currentUserId: string;
  currentDisplayName: string;
  currentAvatarUrl: string | null;
  isGlobalAdmin: boolean;
}

export function ChannelView({
  channel,
  initialMessages,
  currentUserId,
  currentDisplayName,
  currentAvatarUrl,
  isGlobalAdmin,
}: ChannelViewProps) {
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

  const [settingsOpen, setSettingsOpen] = useState(false);

  const threadMessageId = useWorkspaceStore((s) => s.threadMessageId);
  const openThread = useWorkspaceStore((s) => s.openThread);
  const closeThread = useWorkspaceStore((s) => s.closeThread);

  const parentMessage =
    threadMessageId && messages
      ? messages.find((m) => m.id === threadMessageId) ?? null
      : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChannelHeader
          channel={channel}
          currentUserId={currentUserId}
          huddleParticipantCount={participants.length}
          onOpenSettings={() => setSettingsOpen(true)}
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
          channelName={`#${channel.name}`}
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
      {settingsOpen && (
        <ChannelSettingsPanel
          channel={channel}
          currentUserId={currentUserId}
          isGlobalAdmin={isGlobalAdmin}
          onClose={() => setSettingsOpen(false)}
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
