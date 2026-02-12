import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/profile";
import { getDMChannel } from "@/lib/actions/dms";
import { getMessages } from "@/lib/actions/messages";
import { DMView } from "@/components/dm/dm-view";

interface DMPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function DMPage({ params }: DMPageProps) {
  const { channelId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [dmData, messages] = await Promise.all([
    getDMChannel(channelId).catch(() => null),
    getMessages(channelId),
  ]);

  if (!dmData) notFound();

  return (
    <DMView
      channel={dmData.channel}
      otherUser={dmData.otherProfile}
      initialMessages={messages}
      currentUserId={profile.id}
      currentDisplayName={profile.display_name}
      currentAvatarUrl={profile.avatar_url}
    />
  );
}
