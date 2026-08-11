export function movimentoReduzido(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.hasAttribute("data-modo-calmo")) return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function comportamentoRolagem(): ScrollBehavior {
  return movimentoReduzido() ? "auto" : "smooth";
}
