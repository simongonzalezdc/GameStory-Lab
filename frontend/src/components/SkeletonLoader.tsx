export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />

        {/* Metadata skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>

        {/* Buttons skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}
