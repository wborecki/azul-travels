import { useEffect, useState } from "react";

/**
 * Retorna `value` defasado por `delay` ms — útil para debounciar
 * inputs de busca antes de disparar fetches/queries.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
