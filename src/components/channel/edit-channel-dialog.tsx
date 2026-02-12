"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateChannel } from "@/lib/actions/channels";
import type { Channel } from "@/lib/types/database";

interface EditChannelDialogProps {
  channel: Channel;
}

export function EditChannelDialog({ channel }: EditChannelDialogProps) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateChannel(channel.id, {
        name: name.toLowerCase().replace(/\s+/g, "-"),
        description: description || null,
        is_private: isPrivate,
      });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["channel", channel.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Channel name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-[#1a1d21] px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-[#1a1d21] px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="What is this channel about?"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPrivate(!isPrivate)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            isPrivate ? "bg-primary" : "bg-[#565860]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              isPrivate ? "translate-x-4" : ""
            }`}
          />
        </button>
        <span className="text-sm text-foreground">Private channel</span>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
