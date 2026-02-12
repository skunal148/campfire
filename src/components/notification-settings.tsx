"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

export function NotificationSettings() {
  const [muted, setMuted] = useState(false);
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    setMuted(localStorage.getItem("notifications-muted") === "true");
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("notifications-muted", String(next));
  };

  const requestPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermissionState(result);
    }
  };

  if (permissionState === "default") {
    return (
      <button
        onClick={requestPermission}
        className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:scale-105 active:scale-95"
        title="Enable notifications"
      >
        <BellOff className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:scale-105 active:scale-95"
      title={muted ? "Unmute notifications" : "Mute notifications"}
    >
      {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
    </button>
  );
}
