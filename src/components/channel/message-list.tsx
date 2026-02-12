"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, getInitials, isSameDay } from "@/lib/utils/format";
import { useUpdateMessage, useDeleteMessage } from "@/lib/hooks/use-messages";
import { DateSeparator } from "./date-separator";
import { MessageActions } from "./message-actions";
import { MessageReactions } from "./message-reactions";
import { MessageEditor } from "./message-editor";
import { DeleteMessageDialog } from "./delete-message-dialog";
import { MessageAttachment } from "./message-attachment";
import type { MessageWithAuthor } from "@/lib/types/database";

interface MessageListProps {
  messages: MessageWithAuthor[];
  channelId: string;
  currentUserId: string;
  replyCounts: Record<string, number>;
  onOpenThread: (messageId: string) => void;
}

export function MessageList({
  messages,
  channelId,
  currentUserId,
  replyCounts,
  onOpenThread,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutate: updateMsg } = useUpdateMessage(channelId);
  const { mutate: deleteMsg } = useDeleteMessage(channelId);

  // Track initial message IDs so we only animate NEW messages
  const initialIdsRef = useRef<Set<string> | null>(null);
  if (initialIdsRef.current === null) {
    initialIdsRef.current = new Set(messages.map((m) => m.id));
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground animate-fade-in">
        <MessageSquare className="h-10 w-10 opacity-20" />
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1 px-4">
        <div className="py-4">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showDateSep =
              !prevMessage || !isSameDay(prevMessage.created_at, message.created_at);
            const showHeader =
              showDateSep ||
              !prevMessage ||
              prevMessage.user_id !== message.user_id ||
              new Date(message.created_at).getTime() -
                new Date(prevMessage.created_at).getTime() >
                5 * 60 * 1000;

            const isOwn = message.user_id === currentUserId;
            const replyCount = replyCounts[message.id] ?? 0;
            const isNew = !initialIdsRef.current!.has(message.id);
            const animClass = isNew ? (isOwn ? "msg-sent" : "msg-new") : "";

            return (
              <div key={message.id} className={animClass}>
                {showDateSep && <DateSeparator dateStr={message.created_at} />}
                <div
                  className={`message-row group relative flex gap-2 px-2 py-[3px] ${
                    showHeader ? "mt-3 first:mt-0" : ""
                  }`}
                >
                  <MessageActions
                    messageId={message.id}
                    channelId={channelId}
                    isOwn={isOwn}
                    onReply={() => onOpenThread(message.id)}
                    onEdit={() => setEditingId(message.id)}
                    onDelete={() => setDeletingId(message.id)}
                  />
                  {showHeader ? (
                    <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(message.profiles.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 shrink-0 text-center">
                      <span className="invisible text-[10px] text-muted-foreground group-hover:visible">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {showHeader && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {message.profiles.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    {editingId === message.id ? (
                      <MessageEditor
                        initialContent={message.content}
                        onSave={(content) => {
                          updateMsg({ messageId: message.id, content });
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {message.attachment_url && message.attachment_name && message.attachment_type && (
                          <div className={isNew ? "attach-in" : ""}>
                            <MessageAttachment
                              url={message.attachment_url}
                              name={message.attachment_name}
                              type={message.attachment_type}
                            />
                          </div>
                        )}
                      </>
                    )}
                    <MessageReactions messageId={message.id} currentUserId={currentUserId} />
                    {replyCount > 0 && (
                      <button
                        onClick={() => onOpenThread(message.id)}
                        className="mt-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-primary transition-all duration-150 hover:bg-primary/10 hover:text-primary"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span className="font-medium">{replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <DeleteMessageDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        onConfirm={() => {
          if (deletingId) {
            deleteMsg(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </>
  );
}
