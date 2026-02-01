import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant określa kształt skeleton loadera
   * - text: prostokąt dla tekstu (domyślna wysokość: h-4)
   * - circular: okrąg (dla avatarów)
   * - rectangular: prostokąt z rounded corners (dla kart, obrazów)
   */
  variant?: "text" | "circular" | "rectangular";

  /**
   * Typ animacji
   * - wave: shimmer effect (najbardziej modern)
   * - pulse: fade in/out
   * - none: statyczny
   */
  animation?: "wave" | "pulse" | "none";
}

/**
 * Skeleton Loader - Modern Design System 2.0
 *
 * Używany zamiast spinnerów dla lepszej perceived performance.
 * Pokazuje "ghost" layout podczas ładowania danych.
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton variant="text" className="w-48" />
 *
 * // Avatar skeleton
 * <Skeleton variant="circular" className="w-12 h-12" />
 *
 * // Card skeleton
 * <Skeleton variant="rectangular" className="w-full h-32" />
 *
 * // Complex skeleton layout
 * <div className="space-y-4">
 *   <Skeleton variant="text" className="w-3/4" />
 *   <Skeleton variant="text" className="w-1/2" />
 *   <Skeleton variant="rectangular" className="w-full h-48" />
 * </div>
 * ```
 */
export function Skeleton({
  className,
  variant = "rectangular",
  animation = "wave",
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Ładowanie..."
      className={cn(
        // Base styles
        "relative overflow-hidden",

        // Variant shapes
        {
          "h-4 rounded": variant === "text",
          "rounded-full aspect-square": variant === "circular",
          "rounded-lg": variant === "rectangular",
        },

        // Background color
        "bg-border-v2",

        // Animations
        {
          "animate-pulse": animation === "pulse",
          "skeleton-shimmer": animation === "wave",
        },

        className,
      )}
      {...props}
    >
      <span className="sr-only">Ładowanie...</span>
    </div>
  );
}

/**
 * Skeleton Group - Helper dla wielokrotnych skeletonów
 */
export function SkeletonGroup({
  count = 3,
  className,
  ...props
}: SkeletonProps & { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} {...props} />
      ))}
    </>
  );
}

/**
 * Pre-built skeleton layouts dla typowych use cases
 */

// Skeleton dla employee card
export function EmployeeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-v2 bg-background-secondary p-4 space-y-3">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="rectangular" className="w-full h-4" />
      <div className="flex gap-2">
        <Skeleton variant="text" className="w-20 h-6" />
        <Skeleton variant="text" className="w-24 h-6" />
      </div>
    </div>
  );
}

// Skeleton dla table row
export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-border-v2">
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="text" className="w-40" />
      <Skeleton variant="text" className="w-28" />
      <Skeleton variant="text" className="flex-1" />
    </div>
  );
}

// Skeleton dla stat card
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-v2 bg-background-secondary p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-32" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" className="w-24 h-8" />
      <Skeleton variant="text" className="w-40" />
    </div>
  );
}

// Skeleton dla chart
export function ChartSkeleton({ height = "h-80" }: { height?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-v2 bg-background-secondary p-6",
        height,
      )}
    >
      <div className="space-y-4">
        <Skeleton variant="text" className="w-48" />
        <Skeleton
          variant="rectangular"
          className="w-full h-full"
          animation="pulse"
        />
      </div>
    </div>
  );
}

// Skeleton dla page header
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton variant="text" className="w-64 h-8" />
      <Skeleton variant="text" className="w-96 h-5" />
    </div>
  );
}

// Skeleton dla całej listy (employee list)
export function EmployeeListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <EmployeeCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton dla table
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center space-x-4 py-3 border-b-2 border-border-strong mb-2">
        <Skeleton variant="text" className="w-32 h-5" />
        <Skeleton variant="text" className="w-24 h-5" />
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="text" className="w-28 h-5" />
        <Skeleton variant="text" className="flex-1 h-5" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
