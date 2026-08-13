import { useEffect, useState } from 'react';

/**
 * Mirrors `active`, but only flips to `true` after it has stayed true for
 * `delayMs`. Used to avoid flashing a spinner for operations that resolve
 * quickly — e.g. only show "Loading…" once a fetch has taken >2s.
 */
export function useDelayedFlag(active: boolean, delayMs = 2000): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return visible;
}
