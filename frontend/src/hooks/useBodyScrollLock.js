import { useEffect } from 'react';

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    document.body.style.overflow = isLocked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isLocked]);
}
