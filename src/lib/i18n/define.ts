/**
 * Moduł tłumaczeń: polski tekst jest źródłem, angielski musi mieć dokładnie te same klucze
 * (brak klucza w `en` = błąd TypeScript). Klucze bez kropek — kropkę dodaje prefiks modułu.
 * Zmienne w tekście: `{name}` → t('x.y', { name: 'Jan' }).
 */
export function defineMessages<T extends Record<string, string>>(messages: {
  pl: T;
  en: Record<keyof T, string>;
}) {
  return messages;
}
