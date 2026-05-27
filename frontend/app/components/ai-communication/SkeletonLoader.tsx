"use client";

export function SkeletonLoader() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="mt-4 h-24 rounded-2xl bg-white/10" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-white/10" />
            <div className="h-6 w-16 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
