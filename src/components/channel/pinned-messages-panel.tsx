"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pin, X } from "lucide-react";
import { usePinnedMessages, useUnpinMessage } from "@/lib/hooks/use-pins";
import { formatTime, getInitials } from "@/lib/utils/format";

interface PinnedMessagesPanelProps {
  channelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinnedMessagesPanel({ channelId, open, onOpenChange }: PinnedMessagesPanelProps) {
  const { data: pins } = usePinnedMessages(channelId);
  const { mutate: unpin } = useUnpinMessage(channelId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1f22] border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned Messages
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {!pins || pins.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pinned messages yet
            </p>
          ) : (
            <div className="space-y-3">
              {pins.map((pin) => (
                <div
                  key={pin.id}
                  className="group relative rounded-lg border border-border bg-[#2b2d31] p-3 transition-colors duration-150 hover:border-border/80 hover:bg-[#2f3136]"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                        {getInitials(pin.messages.profiles.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {pin.messages.profiles.display_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(pin.messages.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground break-words whitespace-pre-wrap">
                        {pin.messages.content}
                      </p>
                    </div>
                    <button
                      onClick={() => unpin(pin.message_id)}
                      className="invisible group-hover:visible shrink-0 rounded p-1 text-muted-foreground hover:bg-[#3f4147] hover:text-foreground"
                      title="Unpin"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
