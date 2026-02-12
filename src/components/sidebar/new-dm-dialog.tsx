"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useUserSearch } from "@/lib/hooks/use-user-search";
import { useCreateDM } from "@/lib/hooks/use-conversations";

export function NewDMDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: users, isLoading } = useUserSearch(query);
  const { mutate: createDM, isPending } = useCreateDM();

  const handleSelect = (userId: string) => {
    createDM(userId, {
      onSuccess: (channelId) => {
        setOpen(false);
        setQuery("");
        router.push(`/dm/${channelId}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          title="New message"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-[#2b2d31] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a person"
            className="w-full rounded-md border border-border bg-[#1e1f22] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading && query.length >= 1 && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Searching...
              </p>
            )}
            {users?.length === 0 && query.length >= 1 && !isLoading && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                No users found
              </p>
            )}
            {users?.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                disabled={isPending}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground hover:bg-sidebar-accent disabled:opacity-50"
              >
                <Avatar size="sm">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback>
                    {user.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{user.display_name}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
