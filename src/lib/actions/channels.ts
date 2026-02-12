"use server";

import { createClient } from "@/lib/supabase/server";
import type { Channel, ChannelMemberWithProfile, Profile } from "@/lib/types/database";

async function isGlobalAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("is_global_admin")
    .eq("id", userId)
    .single();
  return data?.is_global_admin === true;
}

export async function getChannels(): Promise<Channel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_dm", false)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getChannel(channelId: string): Promise<Channel> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createChannel(name: string, description?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({ name, description: description ?? null, is_private: false, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-join creator
  await supabase
    .from("channel_members")
    .insert({ channel_id: channel.id, user_id: user.id, role: "owner" });

  return channel;
}

export async function joinChannel(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("channel_members")
    .insert({ channel_id: channelId, user_id: user.id, role: "member" });

  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function leaveChannel(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export interface BrowsableChannel extends Channel {
  is_member: boolean;
}

export async function getBrowsableChannels(): Promise<BrowsableChannel[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: channels, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_private", false)
    .eq("is_dm", false)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", user.id);

  const memberSet = new Set(memberships?.map((m) => m.channel_id) ?? []);

  return (channels as Channel[]).map((ch) => ({
    ...ch,
    is_member: memberSet.has(ch.id),
  }));
}

export async function updateChannel(
  channelId: string,
  updates: { name?: string; description?: string | null; is_private?: boolean }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const globalAdmin = await isGlobalAdmin(supabase, user.id);

  if (!globalAdmin) {
    const { data: membership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role))
      throw new Error("Permission denied");
  }

  const { data, error } = await supabase
    .from("channels")
    .update(updates)
    .eq("id", channelId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Channel;
}

export async function getChannelMembers(
  channelId: string
): Promise<ChannelMemberWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("channel_members")
    .select("*, profiles(*)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as ChannelMemberWithProfile[];
}

export async function updateMemberRole(
  channelId: string,
  userId: string,
  role: "admin" | "member"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const globalAdmin = await isGlobalAdmin(supabase, user.id);

  if (!globalAdmin) {
    const { data: membership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner")
      throw new Error("Only the channel owner can change roles");
  }

  const { error } = await supabase
    .from("channel_members")
    .update({ role })
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function removeMember(channelId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const globalAdmin = await isGlobalAdmin(supabase, user.id);

  if (!globalAdmin) {
    const { data: callerMembership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role))
      throw new Error("Permission denied");
  }

  // Can't remove the owner
  const { data: targetMembership } = await supabase
    .from("channel_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .single();

  if (targetMembership?.role === "owner")
    throw new Error("Cannot remove the channel owner");

  const { error } = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function archiveChannel(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const globalAdmin = await isGlobalAdmin(supabase, user.id);

  if (!globalAdmin) {
    const { data: membership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner")
      throw new Error("Only the channel owner can archive");
  }

  const { error } = await supabase
    .from("channels")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", channelId);

  if (error) throw new Error(error.message);
}

export async function addMemberToChannel(channelId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const globalAdmin = await isGlobalAdmin(supabase, user.id);

  if (!globalAdmin) {
    const { data: callerMembership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", user.id)
      .single();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role))
      throw new Error("Permission denied");
  }

  const { error } = await supabase
    .from("channel_members")
    .insert({ channel_id: channelId, user_id: userId, role: "member" });

  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function checkIsGlobalAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return isGlobalAdmin(supabase, user.id);
}
