'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Zdarzenie beforeinstallprompt przychodzi raz — przechowujemy je na poziomie modułu,
// żeby każdy komponent (np. przycisk na /harmonogram) mógł je później użyć.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Instalacja aplikacji (PWA): czy przeglądarka może zainstalować jednym kliknięciem i czy już jest zainstalowana. */
export function usePwaInstall() {
  const prompt = useSyncExternalStore(subscribe, () => deferredPrompt, () => null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const onInstalled = () => setIsStandalone(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const event = deferredPrompt;
    if (!event) return 'unavailable';
    await event.prompt();
    const { outcome } = await event.userChoice;
    deferredPrompt = null;
    emit();
    return outcome;
  }, []);

  return { canPrompt: prompt !== null, isStandalone, isIOS, install };
}
