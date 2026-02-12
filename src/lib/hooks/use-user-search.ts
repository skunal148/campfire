"use client";

import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/actions/dms";

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["user-search", query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 1,
  });
}
