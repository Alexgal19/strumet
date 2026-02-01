import React, { useEffect, useState } from "react";

/**
 * useDebounced Value Hook
 *
 * Opóźnia aktualizację wartości o określony czas.
 * Użyteczne dla search inputs, filters, i innych use cases gdzie chcemy
 * ograniczyć liczbę operacji (np. Firebase queries).
 *
 * @param value - Wartość do zdebouncowania
 * @param delay - Opóźnienie w milisekundach (domyślnie 300ms)
 * @returns Zdebouncowana wartość
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebouncedValue(query, 300);
 *
 *   useEffect(() => {
 *     // To wykona się dopiero 300ms po ostatniej zmianie query
 *     if (debouncedQuery) {
 *       fetchResults(debouncedQuery);
 *     }
 *   }, [debouncedQuery]);
 *
 *   return (
 *     <input
 *       value={query}
 *       onChange={e => setQuery(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function - cancel timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebounced Callback Hook
 *
 * Opóźnia wywołanie funkcji o określony czas.
 *
 * @param callback - Funkcja do zdebouncowania
 * @param delay - Opóźnienie w milisekundach
 * @returns Zdebouncowana funkcja
 *
 * @example
 * ```tsx
 * function FilterComponent() {
 *   const debouncedSearch = useDebouncedCallback((query: string) => {
 *     fetchResults(query);
 *   }, 300);
 *
 *   return (
 *     <input onChange={e => debouncedSearch(e.target.value)} />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
): (...args: Parameters<T>) => void {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}
