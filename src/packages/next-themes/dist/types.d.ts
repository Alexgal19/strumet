
import type { Dispatch, ReactNode, SetStateAction } from 'react';
export declare const useTheme: () => UseThemeProps | undefined;
export declare const ThemeProvider: (props: ThemeProviderProps) => React.ReactNode;
export interface ThemeProviderProps {
    /** List of all available theme names */
    themes?: string[];
    /** Forced theme name for the current page */
    forcedTheme?: string;
    /** Whether to switch between dark and light themes based on user's browser settings */
    enableSystem?: boolean;
    /** Disable all CSS transitions when switching themes */
    disableTransitionOnChange?: boolean;
    /** Whether to indicate to browsers which color scheme is used (dark or light) for built-in UI like inputs and scrollbars */
    enableColorScheme?: boolean;
    /** Key used to store theme setting in localStorage */
    storageKey?: string;
    /** Default theme name (for v0.0.12 and lower the default was light). If `enableSystem` is false, the default theme is light */
    defaultTheme?: string;
    /** HTML attribute modified with the theme name. */
    attribute?: string | 'class';
    /** Mapping of theme name to HTML attribute value. Object where key is the theme name and value is the attribute value */
    value?: ValueObject;
    /** Nonce string to pass to the inline script for CSP headers */
    nonce?: string;
    /** React children */
    children?: ReactNode;
}
export interface UseThemeProps {
    /** List of all available theme names */
    themes: string[];
    /** Forced theme name for the current page */
    forcedTheme?: string;
    /** Update the theme */
    setTheme: (theme: string) => void;
    /** Active theme name */
    theme?: string;
    /** If `enableSystem` is true, returns the System theme name (dark or light) */
    systemTheme?: 'dark' | 'light';
    /** If enableSystem is true, represents the resolved theme name, resolvedTheme is the same as theme if enableSystem is false */
    resolvedTheme?: string;
}
export interface ValueObject {
    [themeName: string]: string;
}
type UseTheme = () => UseThemeProps;
declare const useTheme_v0: UseTheme;
export declare const ThemeProvider_v0: ({ forcedTheme, disableTransitionOnChange, enableSystem, enableColorScheme, storageKey, themes, defaultTheme, attribute, value, children, nonce, }: ThemeProviderProps) => JSX.Element;
export { useTheme_v0 as useTheme_v0_i_know_what_i_am_doing };
export declare function getTheme(key: string, fallback?: string): string | undefined;
export declare const Themed: ({ children, as, ...props }: {
    as?: any;
    [key: string]: any;
}) => JSX.Element;
export declare const useThemedStyles: (styles: any) => any;
export declare function useThemeDispatch(): Dispatch<SetStateAction<string | undefined>> | null;
export {};
