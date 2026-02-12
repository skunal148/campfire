"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChannel, joinChannel, leaveChannel } from "@/lib/actions/channels";

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createChannel(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => joinChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["browsable-channels"] });
    },
  });
}

export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => leaveChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["browsable-channels"] });
    },
  });
}
