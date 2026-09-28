import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from './Toast';

/** Registers the service worker; shows "offline ready" once and a reload prompt when a new version is deployed. */
export function UpdatePrompt() {
  const toast = useToast();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Check for updates every hour while the app is open.
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast({ message: 'ShahiFit is ready to work offline' });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, toast]);

  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version of ShahiFit is available.</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => void updateServiceWorker(true)}>
        Update
      </button>
    </div>
  );
}
