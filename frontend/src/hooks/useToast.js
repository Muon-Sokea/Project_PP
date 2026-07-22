import { useState, useRef, useCallback } from 'react';

export function useToast(duration = 2200) {
  const [toast, setToast] = useState({ msg: '', show: false });
  const timerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), duration);
  }, [duration]);

  return [toast, showToast];
}
