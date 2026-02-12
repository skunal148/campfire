"use client";

import { useState } from "react";
import { SmilePlus, MessageSquare, Pencil, Trash2, Pin } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { useToggleReaction } from "@/lib/hooks/use-reactions";
import { usePinMessage } from "@/lib/hooks/use-pins";

interface MessageActionsProps {
  messageId: string;
  channelId: string;
  isOwn: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MessageActions({
  messageId,
  channelId,
  isOwn,
  onReply,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  const { mutate: toggle } = useToggleReaction(messageId);
  const { mutate: pin } = usePinMessage(channelId);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={`actions-toolbar absolute -top-3 right-2 z-10 rounded-md border border-border bg-[#2b2d31] shadow-lg ${
        pickerOpen ? "flex" : "hidden group-hover:flex"
      }`}
    >
      <EmojiPicker
        onSelect={(emoji) => toggle(emoji)}
        onOpenChange={setPickerOpen}
      >
        <button
          className="p-1.5 text-muted-foreground transition-colors duration-100 hover:bg-[#3f4147] hover:text-foreground rounded-l-md"
          title="Add reaction"
        >
          <SmilePlus className="h-4 w-4" />
        </button>
      </EmojiPicker>
      <button
        onClick={onReply}
        className="p-1.5 text-muted-foreground transition-colors duration-100 hover:bg-[#3f4147] hover:text-foreground"
        title="Reply in thread"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
      <button
        onClick={() => pin(messageId)}
        className="p-1.5 text-muted-foreground transition-colors duration-100 hover:bg-[#3f4147] hover:text-foreground"
        title="Pin message"
      >
        <Pin className="h-4 w-4" />
      </button>
      {isOwn && (
        <>
          <button
            onClick={onEdit}
            className="p-1.5 text-muted-foreground transition-colors duration-100 hover:bg-[#3f4147] hover:text-foreground"
            title="Edit message"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-muted-foreground transition-colors duration-100 hover:bg-red-500/10 hover:text-destructive rounded-r-md"
            title="Delete message"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
