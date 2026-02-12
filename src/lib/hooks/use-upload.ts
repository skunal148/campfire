"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUploadAttachment() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("attachments")
        .upload(path, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(path);

      return {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading };
}

export function useUploadAvatar() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(async (file: File, userId: string) => {
    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}.${ext}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-busting param
      return `${urlData.publicUrl}?t=${Date.now()}`;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading };
}
