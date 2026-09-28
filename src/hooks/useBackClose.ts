import { useEffect, useRef } from 'react';

/*
 * Makes the Android back button (and browser back) close the top-most sheet/dialog
 * instead of leaving the app. Each open sheet owns one history entry.
 * When one sheet closes and another opens in the same update (e.g. "Edit" from a
 * details sheet), the history entry is handed over instead of popped and re-pushed.
 */
interface Entry {
  close: () => void;
}
const stack: Entry[] = [];
let ignorePops = 0;
let pendingBacks = 0;
let listening = false;

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--;
      return;
    }
    const top = stack.pop();
    top?.close();
  });
}

export function useBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    ensureListener();
    const entry: Entry = { close: () => onCloseRef.current() };
    stack.push(entry);
    if (pendingBacks > 0) {
      pendingBacks--; // reuse the entry of the sheet that just closed
    } else {
      try {
        history.pushState({ shahifitSheet: stack.length }, '');
      } catch {
        /* ignore */
      }
    }
    return () => {
      const idx = stack.indexOf(entry);
      if (idx === -1) return; // already closed by the back button
      stack.splice(idx, 1);
      pendingBacks++;
      setTimeout(() => {
        if (pendingBacks > 0) {
          pendingBacks--;
          ignorePops++;
          history.back();
        }
      }, 0);
    };
  }, [open]);
}
