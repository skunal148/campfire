"use client";

import { useRef } from "react";
import { Paperclip, Image, FileText, Film, FileArchive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FILE_CATEGORIES = [
  {
    label: "Photo / Image",
    icon: Image,
    accept: "image/*",
  },
  {
    label: "Video",
    icon: Film,
    accept: "video/*",
  },
  {
    label: "Document",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf",
  },
  {
    label: "Archive",
    icon: FileArchive,
    accept: ".zip,.rar,.7z,.tar,.gz",
  },
  {
    label: "Any file",
    icon: Paperclip,
    accept: "*/*",
  },
] as const;

interface AttachMenuProps {
  onFileSelect: (file: File) => void;
}

export function AttachMenu({ onFileSelect }: AttachMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef("*/*");

  const openPicker = (accept: string) => {
    acceptRef.current = accept;
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-48 bg-[#1e1f22] border-border"
        >
          {FILE_CATEGORIES.map((cat) => (
            <DropdownMenuItem
              key={cat.label}
              onClick={() => openPicker(cat.accept)}
              className="gap-2 text-foreground focus:bg-[#3f4147] focus:text-foreground cursor-pointer"
            >
              <cat.icon className="h-4 w-4 text-muted-foreground" />
              {cat.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
