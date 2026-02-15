import { getStatusColor, legalizationStatuses } from '@/lib/legalization-statuses';

describe('Legalization Status Logic', () => {
  it('should contain a non-empty array of legalization statuses with required properties', () => {
    expect(Array.isArray(legalizationStatuses)).toBe(true);
    expect(legalizationStatuses.length).toBeGreaterThan(0);
    for (const status of legalizationStatuses) {
      expect(status).toHaveProperty('value');
      expect(status).toHaveProperty('label');
      expect(status).toHaveProperty('color');
      expect(status).toHaveProperty('highlight');
    }
  });

  it('should return the correct color class for various known statuses', () => {
    expect(getStatusColor('Wiza')).toBe('bg-sky-500 text-white');
    expect(getStatusColor('Otrzymana decyzja')).toBe('bg-green-600 text-white');
    expect(getStatusColor('Wniosek na KP złożony')).toBe('bg-amber-500 text-white');
  });

  it('should return a fallback color class for an unknown or empty status', () => {
    const expectedFallback = 'bg-muted';
    expect(getStatusColor('Some Unknown Status')).toBe(expectedFallback);
    expect(getStatusColor('')).toBe(expectedFallback);
    expect(getStatusColor(undefined as any)).toBe(expectedFallback);
    expect(getStatusColor(null as any)).toBe(expectedFallback);
  });

  it('should return the correct highlight class when forBackground is true', () => {
    expect(getStatusColor('Wniosek na KP złożony', true)).toBe('bg-amber-500/10');
    expect(getStatusColor('Wiza', true)).toBe('bg-sky-500/10');
  });

  it('should return an empty string for background highlight if status is unknown or has no highlight', () => {
    expect(getStatusColor('Nieznany', true)).toBe('');
    expect(getStatusColor('Brak', true)).toBe('');
  });
});
