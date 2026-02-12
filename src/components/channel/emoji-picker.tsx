"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useCallback } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function EmojiPicker({ onSelect, onOpenChange, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const handleEmojiSelect = useCallback(
    (emoji: { native: string }) => {
      onSelect(emoji.native);
      handleOpenChange(false);
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-auto border-border bg-transparent p-0 shadow-xl"
        side="top"
        align="end"
        sideOffset={8}
        collisionPadding={16}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme="dark"
          set="native"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={2}
        />
      </PopoverContent>
    </Popover>
  );
}
