"use server";

import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function generateHuddleToken(channelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify user is a member of the channel
  const { data: membership, error: memberError } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) throw new Error("Not a channel member");

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? "Unknown";
  const roomName = `huddle-${channelId}`;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("LiveKit credentials not configured");

  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: displayName,
    metadata: JSON.stringify({ avatarUrl: profile?.avatar_url ?? null }),
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();

  return { token: jwt, roomName };
}
