"use client";

import { MoreHorizontal, Shield, ShieldCheck, Crown, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUpdateMemberRole, useRemoveMember } from "@/lib/hooks/use-channel-members";
import type { ChannelMemberWithProfile } from "@/lib/types/database";

interface MemberListProps {
  channelId: string;
  members: ChannelMemberWithProfile[];
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member";
  isGlobalAdmin: boolean;
}

const roleBadge: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "bg-yellow-600/20 text-yellow-400" },
  admin: { label: "Admin", className: "bg-blue-600/20 text-blue-400" },
  member: { label: "", className: "" },
};

export function MemberList({
  channelId,
  members,
  currentUserId,
  currentUserRole,
  isGlobalAdmin,
}: MemberListProps) {
  const { mutate: changeRole } = useUpdateMemberRole(channelId);
  const { mutate: kick } = useRemoveMember(channelId);

  const canManageRoles = isGlobalAdmin || currentUserRole === "owner";
  const canKick = isGlobalAdmin || currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="space-y-1">
      <p className="mb-3 text-xs text-muted-foreground">{members.length} members</p>
      {members.map((member) => {
        const profile = member.profiles;
        const badge = roleBadge[member.role];
        const isSelf = member.user_id === currentUserId;
        const isOwner = member.role === "owner";

        const showMenu =
          !isSelf && !isOwner && (canManageRoles || canKick);

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[#3f4147]"
          >
            <Avatar size="sm">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback>
                {profile.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm text-foreground">
                  {profile.display_name}
                </span>
                {isSelf && (
                  <span className="text-[10px] text-muted-foreground">(you)</span>
                )}
                {badge.label && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded p-1 text-muted-foreground hover:bg-[#565860] hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {canManageRoles && member.role === "member" && (
                    <DropdownMenuItem
                      onClick={() =>
                        changeRole({ userId: member.user_id, role: "admin" })
                      }
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Make admin
                    </DropdownMenuItem>
                  )}
                  {canManageRoles && member.role === "admin" && (
                    <DropdownMenuItem
                      onClick={() =>
                        changeRole({ userId: member.user_id, role: "member" })
                      }
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Remove admin
                    </DropdownMenuItem>
                  )}
                  {canKick && (
                    <>
                      {canManageRoles && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-400"
                        onClick={() => kick(member.user_id)}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove from channel
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}
