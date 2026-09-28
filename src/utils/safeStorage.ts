/** Tiny wrappers for UI conveniences only (last tab, theme hint). Real data lives in IndexedDB. */
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(`shahifit.${key}`);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`shahifit.${key}`, value);
  } catch {
    /* storage unavailable — ignore */
  }
}
