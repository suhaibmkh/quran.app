'use client';

import { useEffect } from 'react';

const SW_LAST_ERROR_KEY = 'quran:sw:lastError';
const SW_LAST_STATUS_KEY = 'quran:sw:lastStatus';

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
