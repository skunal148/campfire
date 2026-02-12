import Image from "next/image";
import { ChannelList } from "./channel-list";
import { DMList } from "./dm-list";
import { UserInfo } from "./user-info";
import { InviteDialog } from "./invite-dialog";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Profile, Channel, Conversation } from "@/lib/types/database";

interface SidebarProps {
  profile: Profile | null;
  channels: Channel[];
  conversations: Conversation[];
}

export function Sidebar({ profile, channels, conversations }: SidebarProps) {
  const isGlobalAdmin = profile?.is_global_admin === true;

  return (
    <aside className="flex h-screen w-[260px] flex-col bg-[#1a1d21] border-r border-border animate-fade-in">
      {/* Workspace Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <button className="flex items-center gap-2 text-[15px] font-bold text-white transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="Campfire" width={28} height={28} className="rounded-md" />
          Campfire
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Channel & DM Lists */}
      <ScrollArea className="flex-1 px-2 py-3">
        <ChannelList channels={channels} />

        <Separator className="my-3 bg-border/50" />

        <DMList conversations={conversations} />

        {isGlobalAdmin && (
          <>
            <Separator className="my-3 bg-border/50" />
            <InviteDialog />
          </>
        )}
      </ScrollArea>

      {/* User Info at Bottom */}
      <UserInfo profile={profile} />
    </aside>
  );
}
