"use client";

import { useState } from "react";
import { X, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChannelMembers } from "@/lib/hooks/use-channel-members";
import { leaveChannel } from "@/lib/actions/channels";
import { MemberList } from "./member-list";
import { AddMember } from "./add-member";
import { EditChannelDialog } from "./edit-channel-dialog";
import { ArchiveChannelDialog } from "./archive-channel-dialog";
import type { Channel } from "@/lib/types/database";

interface ChannelSettingsPanelProps {
  channel: Channel;
  currentUserId: string;
  isGlobalAdmin: boolean;
  onClose: () => void;
}

type Tab = "overview" | "members" | "danger";

export function ChannelSettingsPanel({
  channel,
  currentUserId,
  isGlobalAdmin,
  onClose,
}: ChannelSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { data: members } = useChannelMembers(channel.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentMember = members?.find((m) => m.user_id === currentUserId);
  const currentRole = currentMember?.role ?? "member";
  const isOwnerOrAdmin = isGlobalAdmin || currentRole === "owner" || currentRole === "admin";
  const canAddMembers = isGlobalAdmin || currentRole === "owner" || currentRole === "admin";

  const handleLeave = async () => {
    await leaveChannel(channel.id);
    queryClient.invalidateQueries({ queryKey: ["channels"] });
    router.push("/");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: `Members${members ? ` (${members.length})` : ""}` },
    { id: "danger", label: "Danger Zone" },
  ];

  return (
    <div className="settings-slide-in flex h-full w-80 flex-shrink-0 flex-col border-l border-border bg-[#222529]">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h3 className="text-sm font-semibold text-foreground">Channel Settings</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-[#3f4147] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {isOwnerOrAdmin ? (
                <EditChannelDialog channel={channel} />
              ) : (
                <>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Channel name
                    </p>
                    <p className="text-sm text-foreground">#{channel.name}</p>
                  </div>
                  {channel.description && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Description
                      </p>
                      <p className="text-sm text-foreground">
                        {channel.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Visibility
                    </p>
                    <p className="text-sm text-foreground">
                      {channel.is_private ? "Private" : "Public"}
                    </p>
                  </div>
                </>
              )}
              <div className="border-t border-border pt-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm text-foreground">
                  {new Date(channel.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {activeTab === "members" && members && (
            <>
              {canAddMembers && (
                <AddMember channelId={channel.id} existingMembers={members} />
              )}
              <MemberList
                channelId={channel.id}
                members={members}
                currentUserId={currentUserId}
                currentUserRole={currentRole}
                isGlobalAdmin={isGlobalAdmin}
              />
            </>
          )}

          {activeTab === "danger" && (
            <div className="space-y-4">
              {/* Leave channel */}
              {currentRole !== "owner" && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    You will no longer see this channel in your sidebar.
                  </p>
                  <button
                    onClick={handleLeave}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-[#3f4147]"
                  >
                    <LogOut className="h-4 w-4" />
                    Leave channel
                  </button>
                </div>
              )}

              {/* Archive (owner or global admin) */}
              {(currentRole === "owner" || isGlobalAdmin) && (
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Archiving hides the channel and prevents new messages. This
                    cannot be undone.
                  </p>
                  <ArchiveChannelDialog
                    channelId={channel.id}
                    channelName={channel.name}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
