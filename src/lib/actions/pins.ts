"use server";

import { createClient } from "@/lib/supabase/server";
import type { PinnedMessageWithDetails } from "@/lib/types/database";

export async function pinMessage(channelId: string, messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("pinned_messages")
    .insert({ channel_id: channelId, message_id: messageId, pinned_by: user.id });

  if (error) {
    if (error.code === "23505") return; // already pinned
    throw new Error(error.message);
  }
}

export async function unpinMessage(channelId: string, messageId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pinned_messages")
    .delete()
    .eq("channel_id", channelId)
    .eq("message_id", messageId);

  if (error) throw new Error(error.message);
}

export async function getPinnedMessages(channelId: string): Promise<PinnedMessageWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pinned_messages")
    .select("*, messages(*, profiles(*))")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PinnedMessageWithDetails[];
}
