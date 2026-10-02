'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/use-pwa-install';

/**
 * Przycisk "Zainstaluj aplikację". Gdy przeglądarka pozwala (Chrome/Edge/Android) — otwiera systemowe
 * okno instalacji; w pozostałych przypadkach pokazuje krótką instrukcję. Ukryty, gdy aplikacja
 * jest już uruchomiona jako zainstalowana.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const { canPrompt, isStandalone, isIOS, install } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);

  if (isStandalone) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await install();
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`min-h-12 gap-1.5 sm:min-h-9 ${className ?? ''}`}
        onClick={handleClick}
      >
        <Download className="h-4 w-4" />
        Zainstaluj aplikację
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Zainstaluj Baza-ST</DialogTitle>
            <DialogDescription>
              Aplikacja otworzy się we własnym oknie, z ikoną na pulpicie lub w menu Start.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm text-foreground">
            {isIOS ? (
              <li>
                <strong>iPhone / iPad (Safari):</strong> dotknij „Udostępnij”, a potem „Do ekranu początkowego”.
              </li>
            ) : (
              <>
                <li>
                  <strong>Chrome / Edge (laptop):</strong> kliknij ikonę instalacji po prawej stronie paska adresu
                  albo menu ⋮ → „Zainstaluj Baza-ST” (Edge: Aplikacje → „Zainstaluj tę witrynę jako aplikację”).
                </li>
                <li>
                  <strong>Safari (Mac):</strong> menu Plik → „Dodaj do Docku”.
                </li>
                <li>
                  <strong>Android (Chrome):</strong> menu ⋮ → „Zainstaluj aplikację”.
                </li>
                <li>
                  <strong>Firefox:</strong> nie obsługuje instalacji — otwórz stronę w Chrome lub Edge.
                </li>
              </>
            )}
          </ul>
          <p className="text-xs text-foreground">
            Jeśli opcji nie widać, upewnij się, że strona jest otwarta przez HTTPS i nie w trybie prywatnym.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
