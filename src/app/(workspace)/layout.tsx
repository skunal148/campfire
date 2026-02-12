import { Sidebar } from "@/components/sidebar/sidebar";
import { getCurrentProfile } from "@/lib/actions/profile";
import { getChannels } from "@/lib/actions/channels";
import { getConversations } from "@/lib/actions/dms";
import { GlobalSearchDialog } from "@/components/search/global-search-dialog";
import { HuddleNotification } from "@/components/huddle/huddle-notification";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, channels, conversations] = await Promise.all([
    getCurrentProfile(),
    getChannels(),
    getConversations(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={profile} channels={channels} conversations={conversations} />
      <main className="flex flex-1 flex-col bg-[#222529]">{children}</main>
      <GlobalSearchDialog />
      {profile && <HuddleNotification userId={profile.id} />}
    </div>
  );
}
