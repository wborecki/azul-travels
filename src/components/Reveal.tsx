import { type ReactNode } from "react";
import { useInView } from "@/hooks/useReveal";

interface RevealProps {
  children: ReactNode;
  /** Delay em ms (escalonamento entre filhos). */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "header";
}

/**
 * Wrapper genérico para fade-in + slide-up de 20px ao entrar no viewport.
 * Usa IntersectionObserver via `useInView`. Idempotente: dispara uma vez.
 */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
