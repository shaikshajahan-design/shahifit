import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { db } from './db/db';
import { SelectedDateProvider } from './hooks/useSelectedDate';
import { ToastProvider } from './components/Toast';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

type DbState = 'loading' | 'ready' | 'error';

/** Opens IndexedDB before rendering the app; shows a helpful message instead of a blank page if it fails. */
function Root() {
  const [state, setState] = useState<DbState>('loading');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    db.open()
      .then(() => {
        setState('ready');
        // Ask the browser not to evict our data under storage pressure (best-effort).
        navigator.storage?.persist?.().catch(() => {});
      })
      .catch((err: unknown) => {
        setDetail(err instanceof Error ? err.message : String(err));
        setState('error');
      });
  }, []);

  if (state === 'loading') return <div className="boot" aria-busy="true" aria-label="Loading ShahiFit" />;
  if (state === 'error')
    return (
      <div className="fatal" role="alert">
        <h1>ShahiFit can&rsquo;t open its local storage</h1>
        <p>
          Your browser blocked the on-device database (IndexedDB). This usually happens in private/incognito mode or when site
          storage is disabled.
        </p>
        <ul>
          <li>Open ShahiFit in a normal (non-incognito) Chrome tab, or from the installed app.</li>
          <li>Check that site data / cookies are allowed for this site.</li>
          <li>Free up some space on your phone, then reload.</li>
        </ul>
        <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
          Reload
        </button>
        {detail && <p className="fatal-detail">Details: {detail}</p>}
      </div>
    );

  return (
    <ToastProvider>
      <SelectedDateProvider>
        <App />
      </SelectedDateProvider>
    </ToastProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
