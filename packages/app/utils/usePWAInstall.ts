import { pwaInstallHandler } from 'pwa-install-handler';
import { useEffect, useState } from 'preact/hooks';

/**
 * Track whether the browser offers to install the app.
 *
 * @returns A function that shows the browser's install prompt, or `null` if the app can't be
 *   installed.
 */
export function usePWAInstall(): (() => Promise<boolean>) | null {
  const [canInstall, setCanInstall] = useState(pwaInstallHandler.canInstall());

  useEffect(() => {
    pwaInstallHandler.addListener(setCanInstall);
    return () => pwaInstallHandler.removeListener(setCanInstall);
  }, []);

  return canInstall ? pwaInstallHandler.install : null;
}
