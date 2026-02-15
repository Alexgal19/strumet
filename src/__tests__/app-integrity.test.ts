/**
 * Ten plik zawiera testy integralności aplikacji, które sprawdzają,
 * czy podstawowe konfiguracje i zależności działają poprawnie.
 */

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
  
});
