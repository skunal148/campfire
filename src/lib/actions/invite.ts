"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types/database";

async function requireGlobalAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("profiles")
    .select("is_global_admin")
    .eq("id", user.id)
    .single();

  if (!data?.is_global_admin) throw new Error("Permission denied");
  return user;
}

export async function inviteUser(email: string, displayName: string, password: string) {
  await requireGlobalAdmin();

  const admin = createAdminClient();

  // Create the user account
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error) throw new Error(error.message);

  // Create their profile
  await admin
    .from("profiles")
    .upsert({
      id: data.user.id,
      display_name: displayName,
      avatar_url: null,
    });

  // Auto-join #general
  const { data: general } = await admin
    .from("channels")
    .select("id")
    .eq("name", "general")
    .single();

  if (general) {
    await admin
      .from("channel_members")
      .upsert({ channel_id: general.id, user_id: data.user.id, role: "member" });
  }

  return { userId: data.user.id, email };
}

export async function getInvitedUsers(): Promise<
  { id: string; email: string; display_name: string; created_at: string }[]
> {
  await requireGlobalAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  const { data: authData } = await admin.auth.admin.listUsers();

  const emailMap = new Map<string, string>();
  authData?.users?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email);
  });

  return (data as Pick<Profile, "id" | "display_name" | "created_at">[]).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? "unknown",
    display_name: p.display_name,
    created_at: p.created_at,
  }));
}

export async function deleteUser(userId: string) {
  await requireGlobalAdmin();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  // Profile + channel_members cascade from auth.users FK
}
