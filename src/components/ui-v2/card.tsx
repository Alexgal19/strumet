import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card Variants - Design System 2.0
 *
 * Nowoczesne karty z glassmorphism, elevation, i hover effects
 */
const cardVariants = cva(
  // Base styles
  cn("rounded-xl", "transition-all duration-200"),
  {
    variants: {
      variant: {
        // Default - Solid card with subtle border
        default: cn(
          "bg-background-secondary",
          "border border-border-subtle",
          "shadow-elevation-sm",
        ),

        // Glass - Glassmorphism effect
        glass: cn(
          "bg-background-secondary/60",
          "backdrop-blur-xl",
          "border border-white/10",
          "shadow-elevation-md",
        ),

        // Elevated - Card with more prominent shadow
        elevated: cn(
          "bg-background-secondary",
          "border border-border-subtle",
          "shadow-elevation-lg",
        ),

        // Bordered - Subtle outline style
        bordered: cn("bg-transparent", "border-2 border-border-default"),

        // Flat - No shadows or borders
        flat: cn("bg-background-secondary"),

        // Gradient - With gradient border effect
        gradient: cn(
          "bg-background-secondary",
          "relative",
          "before:absolute before:inset-0 before:rounded-xl",
          "before:p-[1px] before:bg-gradient-to-r before:from-primary-v2-500 before:to-accent-v2-500",
          "before:-z-10",
          "shadow-elevation-md",
        ),
      },

      // Hover behavior
      hover: {
        none: "",
        lift: cn(
          "hover:shadow-elevation-xl",
          "hover:scale-[1.02]",
          "hover:-translate-y-1",
          "cursor-pointer",
        ),
        glow: cn(
          "hover:shadow-glow-primary",
          "hover:border-primary-v2-500/50",
          "cursor-pointer",
        ),
        scale: cn("hover:scale-[1.02]", "cursor-pointer"),
      },

      // Padding
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      padding: "default",
    },
  },
);

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Czy karta jest interaktywna (clickable)
   */
  interactive?: boolean;
}

/**
 * Card Component - Design System 2.0
 *
 * Container component używany wszędzie w aplikacji.
 * Wspiera glassmorphism, hover effects, i różne style elevation.
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Tytuł</CardTitle>
 *   </CardHeader>
 *   <CardContent>Treść karty</CardContent>
 * </Card>
 *
 * // Glassmorphism card with hover
 * <Card variant="glass" hover="lift">
 *   Content
 * </Card>
 *
 * // Interactive card
 * <Card interactive onClick={handleClick}>
 *   Clickable card
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({
            variant,
            hover: interactive ? hover || "lift" : hover,
            padding,
          }),
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

/**
 * CardHeader - Header section z padding i spacing
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle - Title z odpowiednią typografią
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      "text-foreground-primary",
      className,
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription - Subtitle/description text
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-foreground-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent - Main content area
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter - Footer section (buttons, actions)
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/**
 * Pre-built Card Compositions dla common patterns
 */

// Stat Card - Dla dashboard statistics
export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  ...props
}: {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
} & CardProps) {
  return (
    <Card variant="elevated" className={cn("p-6", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-base font-medium text-foreground-secondary">
          {title}
        </CardTitle>
        {icon && <div className="text-foreground-tertiary">{icon}</div>}
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold text-foreground-primary">
          {value}
        </div>

        {(description || trend) && (
          <div className="flex items-center gap-2">
            {description && (
              <p className="text-xs text-foreground-tertiary">{description}</p>
            )}
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold",
                  trend.positive ? "text-success" : "text-destructive",
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
