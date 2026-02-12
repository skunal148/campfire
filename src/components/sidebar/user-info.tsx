"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Pencil } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { usePresenceContext } from "@/components/presence-provider";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { NotificationSettings } from "@/components/notification-settings";
import type { Profile } from "@/lib/types/database";

interface UserInfoProps {
  profile: Profile | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserInfo({ profile }: UserInfoProps) {
  const { isOnline } = usePresenceContext();
  const online = profile ? isOnline(profile.id) : false;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <Avatar className="h-8 w-8">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {profile ? getInitials(profile.display_name) : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {profile?.display_name ?? "User"}
          </p>
          <div className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                online ? "online-dot bg-green-500" : "bg-gray-500"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {online ? "Active" : "Away"}
            </span>
          </div>
        </div>
        {profile && (
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:scale-105 active:scale-95"
            title="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <NotificationSettings />
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-red-500/10 hover:text-red-400 hover:scale-105 active:scale-95"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
      {profile && (
        <ProfileEditDialog
          profile={profile}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
