"use server";

import { createClient } from "@/lib/supabase/server";
import type { UnreadCount } from "@/lib/types/database";

export async function markChannelRead(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("channel_reads")
    .upsert(
      { user_id: user.id, channel_id: channelId, last_read_at: new Date().toISOString() },
      { onConflict: "user_id,channel_id" }
    );

  if (error) throw new Error(error.message);
}

export async function getUnreadCounts(): Promise<UnreadCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_unread_counts");

  if (error) throw new Error(error.message);
  return (data ?? []) as UnreadCount[];
}
