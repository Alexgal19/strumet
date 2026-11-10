'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale as DateFnsLocale } from 'date-fns';
import { enGB, pl } from 'date-fns/locale';
import { MESSAGE_MODULES, type TranslationKey } from './messages';

export type Locale = 'pl' | 'en';
export type { TranslationKey };
export type TranslateVars = Record<string, string | number>;

export const LOCALES: Locale[] = ['pl', 'en'];
const STORAGE_KEY = 'strumet-locale';

/** Tłumaczenie poza Reactem (np. w funkcjach pomocniczych). Brak tekstu → polski → sam klucz. */
export function translate(locale: Locale, key: TranslationKey, vars?: TranslateVars): string {
  const dot = key.indexOf('.');
  const messages = MESSAGE_MODULES[key.slice(0, dot) as keyof typeof MESSAGE_MODULES] as
    | { pl: Record<string, string>; en: Record<string, string> }
    | undefined;
  const name = key.slice(dot + 1);
  const text = messages?.[locale][name] ?? messages?.pl[name] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, v: string) => (v in vars ? String(vars[v]) : match));
}

/**
 * Wstawia elementy React w miejsce `{zmiennych}` przetłumaczonego tekstu — dla zdań z pogrubieniem:
 * rich(t('x.y'), { name: <strong>{name}</strong> }).
 */
export function rich(template: string, nodes: Record<string, React.ReactNode>): React.ReactNode {
  return template.split(/(\{\w+\})/g).map((part, i) => {
    const match = /^\{(\w+)\}$/.exec(part);
    if (match && match[1] in nodes) return <React.Fragment key={i}>{nodes[match[1]]}</React.Fragment>;
    return part;
  });
}

/** Klucze z formami liczby mnogiej: `xOne`, `xFew`, `xMany` → baza `x`. */
export type PluralKey = TranslationKey extends infer K
  ? K extends `${infer Base}One`
    ? Base
    : never
  : never;

/** Polski: 1 / 2–4 (bez 12–14) / reszta. Angielski: 1 / reszta (forma `Many`). */
function pluralSuffix(locale: Locale, count: number): 'One' | 'Few' | 'Many' {
  if (count === 1) return 'One';
  if (locale === 'en') return 'Many';
  const mod10 = count % 10;
  const mod100 = count % 100;
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'Few' : 'Many';
}

export function translatePlural(locale: Locale, base: PluralKey, count: number, vars?: TranslateVars): string {
  const key = `${base}${pluralSuffix(locale, count)}` as TranslationKey;
  return translate(locale, key, { count, ...vars });
}

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: TranslateVars) => string;
  /** Liczba mnoga: tp('dashboard.people', 3) → „3 osoby” / „3 people”. `{count}` jest wstawiane automatycznie. */
  tp: (base: PluralKey, count: number, vars?: TranslateVars) => string;
  /** Locale dla date-fns (format, formatDistanceToNow). */
  dateLocale: DateFnsLocale;
  /** Locale dla Intl / toLocaleString / localeCompare. */
  intlLocale: string;
}

function buildValue(locale: Locale, setLocale: (l: Locale) => void): I18nValue {
  return {
    locale,
    setLocale,
    t: (key, vars) => translate(locale, key, vars),
    tp: (base, count, vars) => translatePlural(locale, base, count, vars),
    dateLocale: locale === 'en' ? enGB : pl,
    intlLocale: locale === 'en' ? 'en-GB' : 'pl-PL',
  };
}

// Domyślnie polski — komponenty działają też bez providera (np. w testach)
const I18nContext = createContext<I18nValue>(buildValue('pl', () => {}));

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pl');

  // Wybór z przeglądarki wczytujemy po zamontowaniu, żeby HTML z serwera (zawsze PL) zgadzał się przy hydracji
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'pl' || saved === 'en') setLocaleState(saved);
    } catch {
      // brak dostępu do localStorage (tryb prywatny) — zostaje polski
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignorujemy — wybór działa do końca sesji
    }
  }, []);

  const value = useMemo(() => buildValue(locale, setLocale), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
