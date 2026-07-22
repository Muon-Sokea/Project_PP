import { useEffect } from 'react';

export function useEscapeKey(callback) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') callback(e);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [callback]);
}
