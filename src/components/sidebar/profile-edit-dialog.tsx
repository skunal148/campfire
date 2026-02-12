"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/lib/hooks/use-profile";
import { useUploadAvatar } from "@/lib/hooks/use-upload";
import type { Profile } from "@/lib/types/database";

interface ProfileEditDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ profile, open, onOpenChange }: ProfileEditDialogProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [status, setStatus] = useState(profile.status ?? "");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: update, isPending } = useUpdateProfile();
  const { upload: uploadAvatar, isUploading } = useUploadAvatar();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const updates: { display_name?: string; avatar_url?: string; status?: string } = {};

    if (displayName.trim() && displayName !== profile.display_name) {
      updates.display_name = displayName.trim();
    }
    if (status !== (profile.status ?? "")) {
      updates.status = status || undefined;
    }

    if (avatarFile) {
      const url = await uploadAvatar(avatarFile, profile.id);
      updates.avatar_url = url;
    }

    if (Object.keys(updates).length > 0) {
      update(updates);
    }
    onOpenChange(false);
  };

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1f22] border-border text-foreground sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div
              className="group relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-20 w-20">
                {avatarPreview && <AvatarImage src={avatarPreview} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-medium">Change</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label htmlFor="display-name" className="text-xs text-muted-foreground">
              Display name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-[#2b2d31] border-border"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs text-muted-foreground">
              Status
            </Label>
            <Input
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="What's your status?"
              className="bg-[#2b2d31] border-border"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || isUploading || !displayName.trim()}
            >
              {isPending || isUploading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
