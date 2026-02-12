export default function ChannelLoading() {
  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      {/* Header skeleton */}
      <div className="flex h-12 items-center gap-2 border-b border-border px-4">
        <div className="h-4 w-4 rounded bg-muted/30" />
        <div className="h-4 w-24 rounded bg-muted/30" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 px-4 py-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2" style={{ opacity: 1 - i * 0.15 }}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted/20" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 rounded bg-muted/25" />
                <div className="h-2.5 w-10 rounded bg-muted/15" />
              </div>
              <div className="h-3.5 rounded bg-muted/15" style={{ width: `${180 + i * 40}px` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="border-t border-border px-4 py-3">
        <div className="h-10 rounded-lg border border-border bg-[#2b2d31]" />
      </div>
    </div>
  );
}
