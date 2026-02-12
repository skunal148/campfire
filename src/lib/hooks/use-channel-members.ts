"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChannelMembers,
  updateMemberRole,
  removeMember,
  addMemberToChannel,
} from "@/lib/actions/channels";

export function useChannelMembers(channelId: string) {
  return useQuery({
    queryKey: ["channel-members", channelId],
    queryFn: () => getChannelMembers(channelId),
  });
}

export function useUpdateMemberRole(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "member" }) =>
      updateMemberRole(channelId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-members", channelId] });
    },
  });
}

export function useRemoveMember(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-members", channelId] });
    },
  });
}

export function useAddMember(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => addMemberToChannel(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-members", channelId] });
    },
  });
}
