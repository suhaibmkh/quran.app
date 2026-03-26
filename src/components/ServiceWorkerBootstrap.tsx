'use client';

import { useEffect } from 'react';

const SW_LAST_ERROR_KEY = 'quran:sw:lastError';
const SW_LAST_STATUS_KEY = 'quran:sw:lastStatus';
const SW_RELOAD_ONCE_KEY = 'quran:sw:reloadedOnce';

export function ServiceWorkerBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Service workers require secure contexts (or localhost).
    const isLocalhost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocalhost) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        window.localStorage.setItem(SW_LAST_STATUS_KEY, 'registered');
        window.localStorage.removeItem(SW_LAST_ERROR_KEY);

        // Activate updated worker as soon as it's installed.
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Ensure this page is controlled without requiring manual reopen.
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
          const didReload = window.sessionStorage.getItem(SW_RELOAD_ONCE_KEY) === '1';
          if (!didReload) {
            window.sessionStorage.setItem(SW_RELOAD_ONCE_KEY, '1');
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              () => {
                window.location.reload();
              },
              { once: true }
            );

            // Give the newly installed worker a chance to take control now.
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // If there is no waiting worker, force one navigation so active SW can control the page.
            window.location.reload();
          }
        } else {
          // Prime offline route once SW is controlling so fallback can be served offline.
          try {
            await fetch('/offline', { cache: 'reload' });
          } catch {
            // ignore prefetch failures
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown sw registration error';
        window.localStorage.setItem(SW_LAST_STATUS_KEY, 'failed');
        window.localStorage.setItem(SW_LAST_ERROR_KEY, message);
        // Keep console log to simplify production debugging on device.
        console.error('Service worker registration failed:', message);
      }
    };

    const retry = () => {
      void register();
    };

    void register();

    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', retry);

    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', retry);
    };
  }, []);

  return null;
}
