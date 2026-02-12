"use server";

import { createClient } from "@/lib/supabase/server";
import type { Reaction } from "@/lib/types/database";

export async function getReactions(messageId: string): Promise<Reaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Reaction[];
}

export async function toggleReaction(messageId: string, emoji: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { action: "removed" as const };
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ message_id: messageId, user_id: user.id, emoji });
    if (error) throw new Error(error.message);
    return { action: "added" as const };
  }
}
