import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

/**
 * Input Variants - Design System 2.0
 */
const inputVariants = cva(
  // Base styles
  cn(
    "flex w-full rounded-lg",
    "bg-background-tertiary",
    "border border-border-default",
    "px-3 py-2",
    "text-sm text-foreground-primary",
    "placeholder:text-foreground-tertiary",
    "transition-all duration-200",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-v2-500 focus-visible:border-primary-v2-500",
    "hover:border-border-strong",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      variant: {
        default: "",
        ghost:
          "border-transparent bg-transparent hover:bg-background-secondary",
        outline: "bg-transparent",
      },
      inputSize: {
        sm: "h-8 text-xs px-2",
        default: "h-10",
        lg: "h-12 text-base px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Icon wyświetlana po lewej stronie inputu
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon wyświetlana po prawej stronie inputu
   */
  rightIcon?: React.ReactNode;

  /**
   * Czy pokazać przycisk clear (X) gdy input ma wartość
   */
  clearable?: boolean;

  /**
   * Callback wywoływany po kliknięciu clear button
   */
  onClear?: () => void;
}

/**
 * Input Component - Design System 2.0
 *
 * Modern input z focus effects, icons, i clearable functionality
 *
 * @example
 * ```tsx
 * // Basic input
 * <Input placeholder="Wpisz tekst..." />
 *
 * // Search input with icon
 * <Input
 *   type="search"
 *   placeholder="Szukaj..."
 *   leftIcon={<Search className="h-4 w-4" />}
 * />
 *
 * // Clearable input
 * <Input
 *   value={value}
 *   onChange={e => setValue(e.target.value)}
 *   clearable
 *   onClear={() => setValue('')}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      value,
      ...props
    },
    ref,
  ) => {
    const hasIcons = leftIcon || rightIcon || (clearable && value);

    if (hasIcons) {
      return (
        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              leftIcon && "pl-10",
              (rightIcon || (clearable && value)) && "pr-10",
              className,
            )}
            ref={ref}
            value={value}
            {...props}
          />

          {clearable && value && (
            <button
              type="button"
              onClick={onClear}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "text-foreground-tertiary hover:text-foreground-primary",
                "transition-colors",
                "p-0.5 rounded-full hover:bg-background-tertiary",
              )}
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Wyczyść</span>
            </button>
          )}

          {rightIcon && !clearable && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        value={value}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

/**
 * SearchInput - Pre-configured search input component
 */
export interface SearchInputProps extends Omit<
  InputProps,
  "type" | "leftIcon"
> {
  /**
   * Callback dla search query
   */
  onSearch?: (query: string) => void;

  /**
   * Delay przed wywołaniem onSearch (debounce)
   */
  debounceMs?: number;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { onSearch, debounceMs = 300, onChange, clearable = true, ...props },
    ref,
  ) => {
    const [localValue, setLocalValue] = React.useState<string>(
      (props.value as string) || "",
    );
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (onSearch && debounceMs > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onSearch(localValue);
        }, debounceMs);

        return () => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      } else if (onSearch) {
        onSearch(localValue);
      }
    }, [localValue, onSearch, debounceMs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      setLocalValue("");
      onSearch?.("");
      props.onClear?.();
    };

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="h-4 w-4" />}
        value={localValue}
        onChange={handleChange}
        clearable={clearable}
        onClear={handleClear}
        {...props}
      />
    );
  },
);

SearchInput.displayName = "SearchInput";

export { Input, inputVariants };
