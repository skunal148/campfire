"use client";

import { X, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="file-preview-in relative inline-flex items-center gap-2 rounded-lg border border-border bg-[#1e1f22] p-2">
      {isImage && preview ? (
        <img
          src={preview}
          alt={file.name}
          className="h-16 w-16 rounded object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-[#3f4147]">
          <FileIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 max-w-[150px]">
        <p className="truncate text-xs text-foreground">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        onClick={onRemove}
        className="absolute -right-2 -top-2 rounded-full bg-[#3f4147] p-0.5 text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-red-500/20 hover:text-red-400 hover:scale-110 active:scale-90"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
