"use server";

import { createClient } from "@/lib/supabase/server";
import type { SearchResult, Channel, Profile } from "@/lib/types/database";

export async function searchMessages(
  query: string,
  channelId?: string
): Promise<SearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_messages", {
    search_query: query,
    p_channel_id: channelId ?? null,
    max_results: 50,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as SearchResult[];
}

export async function searchChannels(query: string): Promise<Channel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .ilike("name", `%${query}%`)
    .eq("is_dm", false)
    .limit(10);

  if (error) throw new Error(error.message);
  return (data ?? []) as Channel[];
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("display_name", `%${query}%`)
    .neq("id", user.id)
    .limit(10);

  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}
