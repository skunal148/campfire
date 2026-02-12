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

  // Run ALL queries in parallel instead of sequentially
  const [profile, channel, messages, isGlobalAdmin] = await Promise.all([
    getCurrentProfile(),
    getChannel(channelId).catch(() => null),
    getMessages(channelId).catch(() => []),
    checkIsGlobalAdmin().catch(() => false),
  ]);

  if (!profile) redirect("/login");
  if (!channel) notFound();

  // Auto-join public channels (fire-and-forget, don't block render)
  if (!channel.is_private) {
    joinChannel(channelId).catch(() => {});
  }

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
