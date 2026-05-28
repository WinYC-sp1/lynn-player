import { useEffect, useRef, useCallback } from 'react';

export function useResourceCleanup() {
  const cleanupsRef = useRef<Set<() => void>>(new Set());

  const register = useCallback((cleanup: () => void) => {
    cleanupsRef.current.add(cleanup);
    return () => {
      cleanupsRef.current.delete(cleanup);
      cleanup();
    };
  }, []);

  const clear = useCallback(() => {
    cleanupsRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (e) {
        console.error('Error during resource cleanup:', e);
      }
    });
    cleanupsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return { register, clear };
}
