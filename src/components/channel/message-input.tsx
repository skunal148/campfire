"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Smile } from "lucide-react";
import { useSendMessage } from "@/lib/hooks/use-messages";
import { useUploadAttachment } from "@/lib/hooks/use-upload";
import { EmojiPicker } from "./emoji-picker";
import { FilePreview } from "./file-preview";
import { AttachMenu } from "./attach-menu";

interface MessageInputProps {
  channelId: string;
  channelName: string;
  onTyping?: () => void;
}

export function MessageInput({ channelId, channelName, onTyping }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingRef = useRef(0);
  const { mutate: send, isPending } = useSendMessage(channelId);
  const { upload, isUploading } = useUploadAttachment();

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

    send({ content: trimmed, attachment });
    setContent("");
    setPendingFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, pendingFile, isPending, isUploading, send, upload]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";

    if (onTyping) {
      const now = Date.now();
      if (now - lastTypingRef.current > 1000) {
        lastTypingRef.current = now;
        onTyping();
      }
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) setPendingFile(file);
  };

  return (
    <div className="border-t border-border px-4 py-3" onDragOver={handleDragOver} onDrop={handleDrop}>
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
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${channelName}`}
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
  );
}
