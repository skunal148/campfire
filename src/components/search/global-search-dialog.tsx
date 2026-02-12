"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Hash, MessageSquare, SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { useSearchMessages, useSearchChannels, useSearchUsers } from "@/lib/hooks/use-search";
import { getOrCreateDM } from "@/lib/actions/dms";

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function GlobalSearchDialog() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const open = useWorkspaceStore((s) => s.globalSearchOpen);
  const close = useWorkspaceStore((s) => s.closeGlobalSearch);

  const { data: messages, isLoading: messagesLoading } = useSearchMessages(debouncedQuery);
  const { data: channels, isLoading: channelsLoading } = useSearchChannels(debouncedQuery);
  const { data: users, isLoading: usersLoading } = useSearchUsers(debouncedQuery);

  const isLoading = messagesLoading || channelsLoading || usersLoading;
  const hasResults =
    (channels && channels.length > 0) ||
    (users && users.length > 0) ||
    (messages && messages.length > 0);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const store = useWorkspaceStore.getState();
        if (store.globalSearchOpen) {
          store.closeGlobalSearch();
        } else {
          store.openGlobalSearch();
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        close();
        setQuery("");
      }
    },
    [close]
  );

  const navigate = useCallback(
    (path: string) => {
      close();
      setQuery("");
      router.push(path);
    },
    [close, router]
  );

  const handleUserSelect = useCallback(
    async (userId: string) => {
      const channelId = await getOrCreateDM(userId);
      navigate(`/dm/${channelId}`);
    },
    [navigate]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Search</DialogTitle>
        <DialogDescription>Search messages, channels, and people</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 gap-0" showCloseButton={false}>
        <Command shouldFilter={false} className="bg-[#1e1f22]">
          <CommandInput
            placeholder="Search messages, channels, people..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[400px]">
            {debouncedQuery.length >= 1 && !isLoading && !hasResults && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {debouncedQuery.length < 1 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <SearchIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Type to search messages, channels, and people
              </div>
            )}

            {channels && channels.length > 0 && (
              <CommandGroup heading="Channels">
                {channels.map((ch) => (
                  <CommandItem
                    key={ch.id}
                    value={ch.id}
                    onSelect={() => navigate(`/channel/${ch.id}`)}
                    className="cursor-pointer"
                  >
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span>{ch.name}</span>
                    {ch.description && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">
                        {ch.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {users && users.length > 0 && (
              <CommandGroup heading="People">
                {users.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={u.id}
                    onSelect={() => handleUserSelect(u.id)}
                    className="cursor-pointer"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                        {u.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.display_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {messages && messages.length > 0 && (
              <CommandGroup heading="Messages">
                {messages.slice(0, 10).map((msg) => (
                  <CommandItem
                    key={msg.id}
                    value={msg.id}
                    onSelect={() => navigate(`/channel/${msg.channel_id}`)}
                    className="cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{msg.display_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          in #{msg.channel_name}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{msg.content}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
