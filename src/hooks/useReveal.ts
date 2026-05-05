import { useEffect, useRef, useState } from "react";

/**
 * Dispara `true` uma única vez quando o elemento entra no viewport.
 * IMPORTANTE: começa como `true` para garantir que o conteúdo fique
 * visível em SSR e caso o IntersectionObserver não esteja disponível
 * ou não dispare por algum motivo. Se o JS rodar no cliente e o
 * elemento ainda não estiver no viewport, voltamos para `false` e
 * deixamos o observer fazer o reveal animado.
 */
export function useInView<T extends Element = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    // Se já está visível no viewport, mantém true e não anima.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh && rect.bottom > 0) {
      setInView(true);
      return;
    }

    // Caso contrário, esconde para fazer a animação ao entrar.
    setInView(false);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 0px 0px", ...options },
    );
    obs.observe(el);

    // Fallback: garante visibilidade após 1.5s mesmo se o observer falhar.
    const fallback = window.setTimeout(() => setInView(true), 1500);

    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, [options]);

  return { ref, inView };
}

/**
 * Conta de 0 até `target` quando entra no viewport. Duração padrão 1500ms,
 * easing easeOutCubic. Respeita `prefers-reduced-motion`.
 */
export function useCountUp(target: number, durationMs = 1500) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, durationMs]);

  return { ref, value };
}
