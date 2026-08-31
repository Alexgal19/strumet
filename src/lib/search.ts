/**
 * Wyszukiwanie w stylu Excel:
 * - ignoruje wielkość liter,
 * - ignoruje polskie znaki diakrytyczne (ą -> a, ł -> l, ...),
 * - dzieli zapytanie na słowa i wymaga, aby KAŻDE słowo wystąpiło
 *   w co najmniej jednym z przeszukiwanych pól (logika OR między polami,
 *   AND między słowami — jak filtry w Excelu).
 */

export function normalizeForSearch(value: unknown): string {
  if (value === null || value === undefined) return '';
  return (
    String(value)
      .toLowerCase()
      // "ł" nie ma dekompozycji NFD, więc mapujemy jawnie PRZED normalize()
      .replace(/ł/g, 'l')
      .normalize('NFD')
      // usuwamy wszystkie znaki diakrytyczne (ogonki, kreski itd.)
      .replace(/\p{M}/gu, '')
  );
}

export function excelLikeMatch(query: string, fields: unknown[]): boolean {
  const words = normalizeForSearch(query)
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return true;

  const normalizedFields = fields.map((field) => normalizeForSearch(field));

  return words.every((word) =>
    normalizedFields.some((field) => field.includes(word))
  );
}

/**
 * Filtr dla cmdk (`<Command filter={...}>`) — 1 = pokazujemy, 0 = ukrywamy.
 */
export function commandExcelFilter(value: string, search: string): number {
  if (!search) return 1;
  return excelLikeMatch(search, [value]) ? 1 : 0;
}
