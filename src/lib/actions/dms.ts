"use server";

import { createClient } from "@/lib/supabase/server";
import type { Conversation, Profile } from "@/lib/types/database";

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_conversations");

  if (error) throw new Error(error.message);
  return (data ?? []) as Conversation[];
}

export async function getOrCreateDM(otherUserId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_dm", {
    other_user_id: otherUserId,
  });

  if (error) throw new Error(error.message);
  return data as string;
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
  return data as Profile[];
}

export async function getDMChannel(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .eq("is_dm", true)
    .single();

  if (channelError) throw new Error(channelError.message);

  const { data: members, error: membersError } = await supabase
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", channelId);

  if (membersError) throw new Error(membersError.message);

  const otherUserId = members?.find((m) => m.user_id !== user.id)?.user_id;
  if (!otherUserId) throw new Error("DM participant not found");

  const { data: otherProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherUserId)
    .single();

  if (profileError) throw new Error(profileError.message);

  return { channel, otherProfile: otherProfile as Profile };
}
