"use client";

import { useState, useRef, useEffect } from "react";

interface MessageEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function MessageEditor({ initialContent, onSave, onCancel }: MessageEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      ta.selectionStart = ta.value.length;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = content.trim();
      if (trimmed && trimmed !== initialContent) {
        onSave(trimmed);
      } else {
        onCancel();
      }
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="mt-1">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onKeyDown={handleKeyDown}
        className="w-full resize-none rounded border border-primary/50 bg-[#2b2d31] px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        rows={1}
      />
      <p className="mt-1 text-[11px] text-muted-foreground">
        Enter to save &middot; Escape to cancel
      </p>
    </div>
  );
}
