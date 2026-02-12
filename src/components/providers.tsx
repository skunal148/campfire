"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PresenceProvider } from "@/components/presence-provider";
import { NotificationProvider } from "@/components/notification-provider";

export function Providers({
  userId,
  children,
}: {
  userId?: string;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PresenceProvider userId={userId}>
          <NotificationProvider userId={userId}>
            {children}
          </NotificationProvider>
        </PresenceProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
