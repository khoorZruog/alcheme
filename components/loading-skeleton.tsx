import { cn } from "@/lib/utils";

interface SkeletonBlockProps {
  className?: string;
}

function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div className={cn("animate-pulse rounded-2xl bg-gray-100", className)} />
  );
}

export function CosmeCardSkeleton() {
  return (
    <div className="glass-card bg-white rounded-card p-3 overflow-hidden">
      <SkeletonBlock className="h-24 w-full rounded-2xl mb-3" />
      <div className="px-1 space-y-2">
        <SkeletonBlock className="h-2.5 w-12 rounded-full" />
        <SkeletonBlock className="h-3 w-20 rounded-full" />
        <SkeletonBlock className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

export function InventoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CosmeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 px-4">
      <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4 rounded-full" />
        <SkeletonBlock className="h-4 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function BeautyLogSkeleton() {
  return (
    <div className="px-4 space-y-4">
      {/* Calendar placeholder */}
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-24 mx-auto rounded-full" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Card placeholders */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-20 w-full rounded-card" />
      ))}
    </div>
  );
}

export function FeedPostSkeleton() {
  return (
    <div className="glass-card rounded-[20px] overflow-hidden p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-8 h-8 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-2 w-12 rounded-full" />
        </div>
      </div>
      <SkeletonBlock className="aspect-[4/3] w-full rounded-xl" />
      <SkeletonBlock className="h-4 w-3/4 rounded-full" />
      <div className="space-y-1">
        <SkeletonBlock className="h-2.5 w-full rounded-full" />
        <SkeletonBlock className="h-2.5 w-2/3 rounded-full" />
      </div>
      <div className="flex gap-4">
        <SkeletonBlock className="h-5 w-12 rounded-full" />
        <SkeletonBlock className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function FeedGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedPostSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4 px-4">
      <SkeletonBlock className="aspect-[4/3] w-full" />
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-16 rounded-full" />
        <SkeletonBlock className="h-4 w-24 rounded-full" />
        <SkeletonBlock className="h-5 w-48 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <SkeletonBlock className="h-2 w-full rounded-full" />
        <SkeletonBlock className="h-2 w-full rounded-full" />
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}
