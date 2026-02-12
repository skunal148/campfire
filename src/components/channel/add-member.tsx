"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSearch } from "@/lib/hooks/use-user-search";
import { useAddMember } from "@/lib/hooks/use-channel-members";
import type { ChannelMemberWithProfile } from "@/lib/types/database";

interface AddMemberProps {
  channelId: string;
  existingMembers: ChannelMemberWithProfile[];
}

export function AddMember({ channelId, existingMembers }: AddMemberProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data: results } = useUserSearch(query);
  const { mutate: addMember, isPending } = useAddMember(channelId);

  const existingIds = new Set(existingMembers.map((m) => m.user_id));
  const filtered = results?.filter((u) => !existingIds.has(u.id)) ?? [];

  const handleAdd = (userId: string) => {
    addMember(userId);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="mb-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      ) : (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-md border border-border bg-[#1a1d21] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                setOpen(false);
              }
            }}
          />
          {query.length >= 1 && (
            <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-[#1a1d21]">
              {filtered.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  No users found
                </p>
              ) : (
                filtered.map((user) => (
                  <button
                    key={user.id}
                    disabled={isPending}
                    onClick={() => handleAdd(user.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#3f4147] disabled:opacity-50"
                  >
                    <Avatar size="sm">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback>
                        {user.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground">{user.display_name}</span>
                  </button>
                ))
              )}
            </div>
          )}
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
