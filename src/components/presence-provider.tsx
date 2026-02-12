"use client";

import { createContext, useContext } from "react";
import { usePresence } from "@/lib/hooks/use-presence";

interface PresenceContextValue {
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUsers: new Set(),
  isOnline: () => false,
});

export function PresenceProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const presence = usePresence(userId);

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  return useContext(PresenceContext);
}
