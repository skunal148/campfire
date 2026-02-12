"use client";

import { Download, FileIcon } from "lucide-react";

interface MessageAttachmentProps {
  url: string;
  name: string;
  type: string;
}

export function MessageAttachment({ url, name, type }: MessageAttachmentProps) {
  if (type.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        <img
          src={url}
          alt={name}
          className="max-h-[300px] max-w-full rounded-lg border border-border object-contain cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      download={name}
      className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border bg-[#1e1f22] px-3 py-2 hover:bg-[#2b2d31] transition-colors"
    >
      <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
      <span className="text-sm text-primary truncate max-w-[200px]">{name}</span>
      <Download className="h-4 w-4 text-muted-foreground shrink-0" />
    </a>
  );
}
