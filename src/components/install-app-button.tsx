'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/use-pwa-install';

import { t } from '@/lib/i18n';
/**
 * Przycisk t('importx.installTheApp'). Gdy przeglądarka pozwala (Chrome/Edge/Android) — otwiera systemowe
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
        {t('importx.installTheApp')}
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('importx.installBazaSt')}</DialogTitle>
            <DialogDescription>
              {t('importx.theAppOpensInIts')}
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm text-foreground">
            {isIOS ? (
              <li>
                <strong>{t('importx.iphoneIpadSafari')}</strong> {t('importx.tapShareThenAddTo')}
              </li>
            ) : (
              <>
                <li>
                  <strong>{t('importx.chromeEdgeLaptop')}</strong> {t('importx.clickTheInstallIconOn')}
                </li>
                <li>
                  <strong>{t('importx.safariMac')}</strong> {t('importx.menuFileAddToDock')}
                </li>
                <li>
                  <strong>{t('importx.androidChrome')}</strong> {t('importx.menuInstallApp')}
                </li>
                <li>
                  <strong>{t('importx.firefox')}</strong> {t('importx.doesNotSupportInstallingOpen')}
                </li>
              </>
            )}
          </ul>
          <p className="text-xs text-foreground">
            {t('importx.ifYouDoNotSee')}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
