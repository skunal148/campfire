"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (data) return data as Profile;

  // Auto-create profile for users registered before schema existed
  if (error && error.code === "PGRST116") {
    const displayName =
      user.user_metadata?.display_name || user.email || "User";
    const { data: newProfile } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null,
      })
      .select()
      .single();

    if (newProfile) {
      // Auto-join #general
      const { data: general } = await supabase
        .from("channels")
        .select("id")
        .eq("name", "general")
        .single();

      if (general) {
        await supabase
          .from("channel_members")
          .upsert({ channel_id: general.id, user_id: user.id, role: "member" });
      }

      return newProfile as Profile;
    }
  }

  return null;
}

export async function updateProfile(updates: { display_name?: string; avatar_url?: string; status?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
