

/**
 * Ten plik zawiera testy integralności aplikacji, które sprawdzają,
 * czy podstawowe konfiguracje i zależności działają poprawnie.
 */

import { getStatusColor, legalizationStatuses } from '@/lib/legalization-statuses';

describe('App Integrity Checks', () => {

  // Lista kluczowych zmiennych środowiskowych wymaganych do połączenia z Firebase.
  const requiredFirebaseEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  /**
   * Test sprawdza, czy wszystkie niezbędne zmienne środowiskowe Firebase są zdefiniowane.
   * Jest to kluczowy test "smoke", ponieważ aplikacja nie może funkcjonować bez tej konfiguracji.
   */
  it('should have all required Firebase environment variables defined', () => {
    const missingVars = requiredFirebaseEnvVars.filter(varName => !process.env[varName]);

    // Jeśli jakieś zmienne brakują, test zakończy się niepowodzeniem i wyświetli ich listę.
    expect(missingVars).toEqual([]);
  });

  // - Sprawdzanie, czy główne obiekty konfiguracyjne (np. config.departments) ładują się poprawnie.
  // - Test "smoke" połączenia z emulatorem Firebase.
  
});


describe('Legalization Status Logic', () => {
  /**
   * Test sprawdza, czy statyczna lista statusów legalizacyjnych jest poprawna.
   * Jest to ważne dla spójności UI (np. filtry, opcje w formularzach).
   */
  it('should contain a non-empty array of legalization statuses', () => {
    expect(Array.isArray(legalizationStatuses)).toBe(true);
    expect(legalizationStatuses.length).toBeGreaterThan(0);
  });

  /**
   * Test weryfikuje, czy funkcja pomocnicza `getStatusColor` zwraca prawidłowe klasy CSS
   * dla znanych statusów. To kluczowe dla spójności wizualnej badge'y w tabelach i na kartach.
   */
  it('should return the correct color class for a known status', () => {
    // Sprawdzamy dla 'Wiza'
    const wizaStatus = 'Wiza';
    const expectedWizaColor = 'bg-sky-500 text-white';
    expect(getStatusColor(wizaStatus)).toBe(expectedWizaColor);

    // Sprawdzamy dla 'Otrzymana decyzja'
    const decyzjaStatus = 'Otrzymana decyzja';
    const expectedDecyzjaColor = 'bg-green-600 text-white';
    expect(getStatusColor(decyzjaStatus)).toBe(expectedDecyzjaColor);
  });

  /**
   * Test sprawdza, czy funkcja `getStatusColor` zwraca domyślną klasę,
   * gdy otrzyma nieznany lub pusty status, co zapobiega błędom renderowania.
   */
  it('should return a fallback color for an unknown or empty status', () => {
    const unknownStatus = 'Nieznany Status XYZ';
    const emptyStatus = '';
    const expectedFallbackColor = 'bg-muted';
    
    expect(getStatusColor(unknownStatus)).toBe(expectedFallbackColor);
    expect(getStatusColor(emptyStatus)).toBe(expectedFallbackColor);
  });

  /**
   * Test sprawdza, czy funkcja poprawnie zwraca klasę tła (`highlight`),
   * gdy parametr `forBackground` jest ustawiony na true.
   */
  it('should return the correct highlight class when forBackground is true', () => {
    const status = 'Wniosek na KP złożony';
    const expectedHighlight = 'bg-amber-500/10';
    expect(getStatusColor(status, true)).toBe(expectedHighlight);
  });
});

