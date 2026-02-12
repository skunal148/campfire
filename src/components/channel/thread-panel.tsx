"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useThreadReplies, useSendThreadReply } from "@/lib/hooks/use-thread";
import { useRealtimeThread } from "@/lib/hooks/use-realtime-thread";
import { useUploadAttachment } from "@/lib/hooks/use-upload";
import { MessageReactions } from "./message-reactions";
import { MessageAttachment } from "./message-attachment";
import { FilePreview } from "./file-preview";
import { EmojiPicker } from "./emoji-picker";
import { AttachMenu } from "./attach-menu";
import { formatTime, getInitials } from "@/lib/utils/format";
import type { MessageWithAuthor } from "@/lib/types/database";

interface ThreadPanelProps {
  parentMessage: MessageWithAuthor;
  channelId: string;
  currentUserId: string;
  onClose: () => void;
}

export function ThreadPanel({
  parentMessage,
  channelId,
  currentUserId,
  onClose,
}: ThreadPanelProps) {
  const { data: replies } = useThreadReplies(parentMessage.id);
  const { mutate: sendReply, isPending } = useSendThreadReply(channelId, parentMessage.id);
  useRealtimeThread(parentMessage.id, channelId);

  const [content, setContent] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { upload, isUploading } = useUploadAttachment();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies?.length]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if ((!trimmed && !pendingFile) || isPending || isUploading) return;

    let attachment: { url: string; name: string; type: string } | undefined;
    if (pendingFile) {
      try {
        attachment = await upload(pendingFile);
      } catch {
        return;
      }
    }

    sendReply({ content: trimmed, attachment });
    setContent("");
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [content, pendingFile, isPending, isUploading, sendReply, upload]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  return (
    <div className="thread-slide-in flex w-[400px] shrink-0 flex-col border-l border-border bg-[#1e1f22]">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h3 className="text-sm font-semibold text-foreground">Thread</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground transition-all duration-150 hover:bg-[#3f4147] hover:text-foreground hover:scale-110 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-4">
          {/* Parent message */}
          <div className="flex gap-2 pb-3">
            <Avatar className="mt-0.5 h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(parentMessage.profiles.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {parentMessage.profiles.display_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(parentMessage.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                {parentMessage.content}
              </p>
              {parentMessage.attachment_url && parentMessage.attachment_name && parentMessage.attachment_type && (
                <MessageAttachment
                  url={parentMessage.attachment_url}
                  name={parentMessage.attachment_name}
                  type={parentMessage.attachment_type}
                />
              )}
              <MessageReactions messageId={parentMessage.id} currentUserId={currentUserId} />
            </div>
          </div>

          {/* Reply count divider */}
          {replies && replies.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          )}

          {/* Replies */}
          {replies?.map((reply) => (
            <div key={reply.id} className="message-row flex gap-2 py-0.5 px-1">
              <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {getInitials(reply.profiles.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {reply.profiles.display_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                  {reply.content}
                </p>
                {reply.attachment_url && reply.attachment_name && reply.attachment_type && (
                  <MessageAttachment
                    url={reply.attachment_url}
                    name={reply.attachment_name}
                    type={reply.attachment_type}
                  />
                )}
                <MessageReactions messageId={reply.id} currentUserId={currentUserId} />
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Thread input */}
      <div className="border-t border-border px-4 py-3">
        {pendingFile && (
          <div className="mb-2">
            <FilePreview file={pendingFile} onRemove={() => setPendingFile(null)} />
          </div>
        )}
        <div className="input-container flex items-end gap-2 rounded-lg border border-border bg-[#2b2d31] px-3 py-2">
          <AttachMenu onFileSelect={setPendingFile} />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            className="max-h-[200px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <EmojiPicker onSelect={handleEmojiSelect}>
            <button
              className="shrink-0 rounded p-1.5 text-muted-foreground transition-all duration-150 hover:text-foreground hover:scale-110 active:scale-95"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
          </EmojiPicker>
          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && !pendingFile) || isPending || isUploading}
            className="send-btn shrink-0 rounded p-1.5 text-muted-foreground disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
