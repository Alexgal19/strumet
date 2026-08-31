/**
 * Krótki feedback haptyczny (vibracja) na urządzeniach mobilnych,
 * które go wspierają (Android/Chrome). Na iOS Safari — no-op.
 */
export function haptic(durationMs = 10): void {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };
  if (typeof nav.vibrate === 'function') {
    try {
      nav.vibrate(durationMs);
    } catch {
      // ignorujemy brak wsparcia
    }
  }
}
