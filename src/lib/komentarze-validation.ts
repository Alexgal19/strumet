/**
 * Walidacja komentarza do bloku stanowiska (Zapotrzebowania).
 * Jeden komentarz na stanowisko (klucz: dział___stanowisko).
 * Pusty tekst po trim = usunięcie komentarza.
 */

export const MAX_COMMENT_LEN = 500;

/** Klucz rekordu — ten sam po stronie klienta, API i reguł (bez . # $ [ ] /). */
export function commentKey(department: string, jobTitle: string): string {
  return `${department}___${jobTitle}`.replace(/[.#$\[\]\/]/g, '_');
}

export interface KomentarzInput {
  department: unknown;
  jobTitle: unknown;
  text: unknown;
}

export type KomentarzResult =
  | { ok: true; value: { department: string; jobTitle: string; text: string } }
  | { ok: false; error: string };

export function validateKomentarz(
  input: KomentarzInput,
  allowedDepartments: string[],
  allowedJobTitles: string[]
): KomentarzResult {
  const department = typeof input.department === 'string' ? input.department.trim() : '';
  if (!department) {
    return { ok: false, error: 'Wybierz dział.' };
  }
  if (!allowedDepartments.includes(department)) {
    return { ok: false, error: 'Wybierz dział z listy.' };
  }

  const jobTitle = typeof input.jobTitle === 'string' ? input.jobTitle.trim() : '';
  if (!jobTitle) {
    return { ok: false, error: 'Wybierz stanowisko.' };
  }
  if (!allowedJobTitles.includes(jobTitle)) {
    return { ok: false, error: 'Wybierz stanowisko z listy.' };
  }

  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (text.length > MAX_COMMENT_LEN) {
    return { ok: false, error: `Komentarz może mieć maks. ${MAX_COMMENT_LEN} znaków.` };
  }

  return { ok: true, value: { department, jobTitle, text } };
}
