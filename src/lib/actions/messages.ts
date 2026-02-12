"use server";

import { createClient } from "@/lib/supabase/server";
import type { MessageWithAuthor } from "@/lib/types/database";

export async function getMessages(channelId: string): Promise<MessageWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(*)")
    .eq("channel_id", channelId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as MessageWithAuthor[];
}

export async function sendMessage(
  channelId: string,
  content: string,
  attachment?: { url: string; name: string; type: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure user is a channel member before sending
  const { data: membership } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    // Auto-join public channels
    await supabase
      .from("channel_members")
      .insert({ channel_id: channelId, user_id: user.id, role: "member" });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      user_id: user.id,
      content,
      attachment_url: attachment?.url ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_type: attachment?.type ?? null,
    })
    .select("*, profiles(*)")
    .single();

  if (error) throw new Error(error.message);
  return data as MessageWithAuthor;
}

export async function updateMessage(messageId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("messages")
    .update({ content })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function getThreadReplies(parentId: string): Promise<MessageWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, profiles(*)")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as MessageWithAuthor[];
}

export async function sendThreadReply(
  channelId: string,
  parentId: string,
  content: string,
  attachment?: { url: string; name: string; type: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure user is a channel member
  const { data: membership } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    await supabase
      .from("channel_members")
      .insert({ channel_id: channelId, user_id: user.id, role: "member" });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      user_id: user.id,
      content,
      parent_id: parentId,
      attachment_url: attachment?.url ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_type: attachment?.type ?? null,
    })
    .select("*, profiles(*)")
    .single();

  if (error) throw new Error(error.message);
  return data as MessageWithAuthor;
}

export async function getReplyCountsForChannel(
  channelId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("parent_id")
    .eq("channel_id", channelId)
    .not("parent_id", "is", null);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data) {
    const pid = row.parent_id as string;
    counts[pid] = (counts[pid] || 0) + 1;
  }
  return counts;
}
