import { Skeleton, SkeletonCard } from '@/components/ui';

export default function TodayLoading() {
  return (
    <div className="px-5 pt-6 space-y-4 max-w-[390px] mx-auto">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" rounded="lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-11 w-11" rounded="full" />
      </div>
      {/* Workout card skeleton */}
      <Skeleton className="h-52 w-full" rounded="lg" />
      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16" rounded="lg" />
        <Skeleton className="h-16" rounded="lg" />
        <Skeleton className="h-16" rounded="lg" />
      </div>
      {/* Macro card skeleton */}
      <SkeletonCard />
      {/* AI tip skeleton */}
      <SkeletonCard />
    </div>
  );
}
