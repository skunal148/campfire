"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentProfile, updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types/database";

export function useCurrentUser(initialData?: Profile | null) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentProfile,
    initialData: initialData ?? undefined,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { display_name?: string; avatar_url?: string; status?: string }) =>
      updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}
