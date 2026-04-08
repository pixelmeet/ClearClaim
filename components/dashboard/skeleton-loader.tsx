"use client";

export function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
        <div className="h-10 w-10 bg-muted rounded-xl animate-shimmer" />
      </div>
      <div className="h-8 w-32 bg-muted rounded animate-shimmer" />
      <div className="h-3 w-16 bg-muted rounded animate-shimmer" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted rounded animate-shimmer" />
          <div className="h-3 w-48 bg-muted rounded animate-shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-16 bg-muted rounded-lg animate-shimmer" />
          <div className="h-7 w-16 bg-muted rounded-lg animate-shimmer" />
        </div>
      </div>
      <div className="h-64 bg-muted rounded-xl animate-shimmer" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="h-5 w-40 bg-muted rounded animate-shimmer" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="h-8 w-8 bg-muted rounded-full animate-shimmer" />
            <div className="flex-1 h-4 bg-muted rounded animate-shimmer" />
            <div className="h-4 w-16 bg-muted rounded animate-shimmer" />
            <div className="h-6 w-20 bg-muted rounded-full animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
