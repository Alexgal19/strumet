/**
 * Wyszukiwanie w stylu Excel:
 * - ignoruje wielkość liter,
 * - ignoruje polskie znaki diakrytyczne (ą -> a, ł -> l, ...),
 * - obsługuje transliterację ukraińską/cyrylicę (np. Ткаченко -> Tkachenko),
 * - unifikuje popularne warianty transkrypcji (cz <-> ch, sz <-> sh, w <-> v itd.),
 * - dzieli zapytanie na słowa i wymaga, aby KAŻDE słowo wystąpiło
 *   w co najmniej jednym z przeszukiwanych pól (logika OR między polami,
 *   AND między słowami — jak filtry w Excelu).
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e',
  'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y',
  'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
  'ы': 'y', 'э': 'e', 'ё': 'yo', 'ъ': '',
};

export function transliterateCyrillic(text: string): string {
  return text.replace(/[\u0400-\u04FF]/gu, (ch) => {
    const lower = ch.toLowerCase();
    return CYRILLIC_TO_LATIN[lower] ?? lower;
  });
}

/**
 * Fonetyczna / kanoniczna postać tekstu do wyszukiwania:
 * - cyrylica -> łacinka,
 * - usunięcie polskich znaków diakrytycznych,
 * - ujednolicenie dwuznaków (cz/ch, sz/sh, w/v, itp.).
 */
export function canonicalizePhonetic(text: string): string {
  if (!text) return '';
  let s = transliterateCyrillic(String(text).toLowerCase());

  // Polskie znaki
  s = s
    .replace(/ł/g, 'l')
    .replace(/ą/g, 'a')
    .replace(/ę/g, 'e')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ć/g, 'c')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/ń/g, 'n');

  s = s.normalize('NFD').replace(/\p{M}/gu, '');

  // Dwuznaki i warianty pisowni wschodnioeuropejskiej / paszportowej
  return s
    .replace(/szcz/g, 'shch')
    .replace(/cz/g, 'ch')
    .replace(/sz/g, 'sh')
    .replace(/rz/g, 'zh')
    .replace(/kh/g, 'h')
    .replace(/w/g, 'v')
    .replace(/ts/g, 'c')
    .replace(/ja|ia/g, 'ya')
    .replace(/ju|iu/g, 'yu')
    .replace(/je|ie/g, 'ye');
}

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
  const rawWords = normalizeForSearch(query)
    .split(/\s+/)
    .filter(Boolean);
  if (rawWords.length === 0) return true;

  const phoneticWords = canonicalizePhonetic(query)
    .split(/\s+/)
    .filter(Boolean);

  const rawFields = fields.map((field) => normalizeForSearch(field));
  const phoneticFields = fields.map((field) => canonicalizePhonetic(String(field ?? '')));

  return rawWords.every((word, idx) => {
    const pWord = phoneticWords[idx] || word;
    return (
      rawFields.some((field) => field.includes(word)) ||
      phoneticFields.some((field) => field.includes(pWord))
    );
  });
}

/**
 * Filtr dla cmdk (`<Command filter={...}>`) — 1 = pokazujemy, 0 = ukrywamy.
 */
export function commandExcelFilter(value: string, search: string): number {
  if (!search) return 1;
  return excelLikeMatch(search, [value]) ? 1 : 0;
}
