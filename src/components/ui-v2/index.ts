/**
 * UI Components V2 - Design System 2.0
 *
 * Nowa biblioteka komponentów z modern design, performance optimizations,
 * i lepszym UX (skeleton loaders, hover effects, glassmorphism).
 *
 * Import examples:
 * ```tsx
 * // Named imports
 * import { Button, Card, Input, Skeleton } from '@/components/ui-v2';
 *
 * // Specific imports
 * import { SearchInput } from '@/components/ui-v2';
 * import { StatCard } from '@/components/ui-v2';
 * import { EmployeeCardSkeleton } from '@/components/ui-v2';
 * ```
 */

// Core components
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  StatCard,
} from "./card";
export type { CardProps } from "./card";

export { Input, SearchInput, inputVariants } from "./input";
export type { InputProps, SearchInputProps } from "./input";

export {
  Skeleton,
  SkeletonGroup,
  EmployeeCardSkeleton,
  TableRowSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  PageHeaderSkeleton,
  EmployeeListSkeleton,
  TableSkeleton,
} from "./skeleton";

// Re-export hook
export {
  useDebouncedValue,
  useDebouncedCallback,
} from "@/hooks/use-debounced-value";
