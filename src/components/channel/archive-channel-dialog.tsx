"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { archiveChannel } from "@/lib/actions/channels";

interface ArchiveChannelDialogProps {
  channelId: string;
  channelName: string;
}

export function ArchiveChannelDialog({
  channelId,
  channelName,
}: ArchiveChannelDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await archiveChannel(channelId);
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      router.push("/");
    } catch {
      setArchiving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Archive channel
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive #{channelName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will hide the channel from the sidebar. Messages will be
            preserved but no new messages can be sent. Type{" "}
            <strong>{channelName}</strong> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={channelName}
          className="w-full rounded-md border border-border bg-[#1a1d21] px-3 py-2 text-sm text-foreground outline-none focus:border-red-500"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={confirmText !== channelName || archiving}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {archiving ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
