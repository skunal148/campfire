"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Headphones, X } from "lucide-react";
import { addHuddleListener } from "@/lib/huddle-broadcast";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

interface HuddleNotice {
  id: string;
  channelId: string;
  displayName: string;
}

interface HuddleNotificationProps {
  userId: string;
}

export function HuddleNotification({ userId }: HuddleNotificationProps) {
  const [notices, setNotices] = useState<HuddleNotice[]>([]);
  const router = useRouter();
  const { showNotification } = useNotifications();

  useEffect(() => {
    const remove = addHuddleListener((payload) => {
      const { channelId, startedBy, displayName, targetUserIds } = payload as {
        channelId: string;
        startedBy: string;
        displayName: string;
        targetUserIds: string[];
      };

      // Only show to targeted members
      if (!targetUserIds.includes(userId)) return;

      // Don't notify if viewing that channel
      const activeChannelId = useWorkspaceStore.getState().activeChannelId;
      if (activeChannelId === channelId && !document.hidden) return;

      // In-app toast
      const id = `${channelId}-${Date.now()}`;
      setNotices((prev) => [...prev, { id, channelId, displayName }]);
      setTimeout(() => {
        setNotices((prev) => prev.filter((n) => n.id !== id));
      }, 8000);

      // Browser notification + sound
      showNotification(
        "Huddle started",
        `${displayName} started a huddle`,
        `/channel/${channelId}`
      );
    });

    return remove;
  }, [userId, showNotification]);

  const dismiss = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleJoin = useCallback(
    (notice: HuddleNotice) => {
      dismiss(notice.id);
      router.push(`/channel/${notice.channelId}`);
    },
    [dismiss, router]
  );

  if (notices.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] flex flex-col gap-2">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className="flex items-center gap-3 rounded-lg border border-green-800 bg-[#1a1d21]/95 px-4 py-3 shadow-xl backdrop-blur-sm animate-in slide-in-from-right"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/20">
            <Headphones className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Huddle started</p>
            <p className="text-xs text-muted-foreground">
              {notice.displayName} started a huddle
            </p>
          </div>
          <button
            onClick={() => handleJoin(notice)}
            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
          >
            Join
          </button>
          <button
            onClick={() => dismiss(notice.id)}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
