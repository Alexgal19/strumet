import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Button Variants - Design System 2.0
 *
 * Nowoczesne przyciski z gradient effects, smooth transitions, i accessibility
 */
const buttonVariants = cva(
  // Base styles - wspólne dla wszystkich wariantów
  cn(
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg",
    "text-sm font-medium",
    "transition-all duration-200",
    "ring-offset-background",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-v2-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95", // Micro-interaction on click
  ),
  {
    variants: {
      variant: {
        // Primary - Gradient button (main CTA)
        default: cn(
          "bg-gradient-to-r from-primary-v2-500 to-primary-v2-600",
          "text-white font-semibold",
          "shadow-elevation-md hover:shadow-elevation-lg",
          "hover:from-primary-v2-600 hover:to-primary-v2-700",
          "hover:scale-[1.02]",
        ),

        // Accent - Electric cyan gradient
        accent: cn(
          "bg-gradient-to-r from-accent-v2-500 to-accent-v2-600",
          "text-white font-semibold",
          "shadow-elevation-md hover:shadow-elevation-lg",
          "hover:from-accent-v2-600 hover:to-accent-v2-700",
          "hover:scale-[1.02]",
        ),

        // Destructive - Danger actions
        destructive: cn(
          "bg-destructive text-destructive-foreground",
          "shadow-elevation-sm hover:shadow-elevation-md",
          "hover:bg-destructive/90",
        ),

        // Success - Confirmation actions
        success: cn(
          "bg-success text-white",
          "shadow-elevation-sm hover:shadow-elevation-md",
          "hover:bg-success-light",
        ),

        // Outline - Secondary actions
        outline: cn(
          "border-2 border-border-v2",
          "bg-transparent",
          "text-foreground-primary",
          "hover:bg-background-tertiary",
          "hover:border-primary-v2-500",
          "hover:text-primary-v2-500",
        ),

        // Secondary - Subtle actions
        secondary: cn(
          "bg-background-secondary",
          "text-foreground-primary",
          "border border-border-v2",
          "hover:bg-background-tertiary",
          "shadow-elevation-sm hover:shadow-elevation-md",
        ),

        // Ghost - Minimal style
        ghost: cn(
          "bg-transparent",
          "text-foreground-secondary",
          "hover:bg-background-secondary",
          "hover:text-foreground-primary",
        ),

        // Link - Text button
        link: cn(
          "text-primary-v2-500",
          "underline-offset-4",
          "hover:underline",
          "hover:text-primary-v2-600",
        ),

        // Glass - Glassmorphism effect
        glass: cn(
          "bg-white/10 backdrop-blur-xl",
          "border border-white/20",
          "text-white",
          "hover:bg-white/20",
          "shadow-elevation-md hover:shadow-elevation-lg",
        ),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button Component - Design System 2.0
 *
 * Nowoczesny button z gradient effects, loading states, i accessibility
 *
 * @example
 * ```tsx
 * // Primary gradient button
 * <Button>Zapisz zmiany</Button>
 *
 * // Accent button
 * <Button variant="accent">Potwierdź</Button>
 *
 * // With icons
 * <Button leftIcon={<PlusCircle />}>Dodaj pracownika</Button>
 *
 * // Loading state
 * <Button loading>Zapisywanie...</Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <Settings />
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
