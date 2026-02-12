import { notFound, redirect } from "next/navigation";
import { getChannel, joinChannel, checkIsGlobalAdmin } from "@/lib/actions/channels";
import { getMessages } from "@/lib/actions/messages";
import { getCurrentProfile } from "@/lib/actions/profile";
import { ChannelView } from "@/components/channel/channel-view";

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;

  const [profile, channel] = await Promise.all([
    getCurrentProfile(),
    getChannel(channelId).catch(() => null),
  ]);

  if (!profile) redirect("/login");
  if (!channel) notFound();

  // Ensure user is a member (auto-join public channels)
  if (!channel.is_private) {
    try {
      await joinChannel(channelId);
    } catch {
      // Already a member or other non-critical error
    }
  }

  const [messages, isGlobalAdmin] = await Promise.all([
    getMessages(channelId),
    checkIsGlobalAdmin(),
  ]);

  return (
    <ChannelView
      channel={channel}
      initialMessages={messages}
      currentUserId={profile.id}
      currentDisplayName={profile.display_name}
      currentAvatarUrl={profile.avatar_url}
      isGlobalAdmin={isGlobalAdmin}
    />
  );
}
