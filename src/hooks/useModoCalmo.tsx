import { createContext, useCallback, useContext, useEffect, useState } from "react";

const CHAVE_ARMAZENAMENTO = "turismo-azul:modo-calmo";
const ATRIBUTO = "data-modo-calmo";

interface ModoCalmoContexto {
  ativo: boolean;
  alternar: () => void;
}

const Contexto = createContext<ModoCalmoContexto>({ ativo: false, alternar: () => {} });

function lerPreferencia(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_ARMAZENAMENTO) === "1";
  } catch {
    return false;
  }
}

function salvarPreferencia(ativo: boolean): void {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, ativo ? "1" : "0");
  } catch {
    return;
  }
}

export function ModoCalmoProvider({ children }: { children: React.ReactNode }) {
  const [ativo, setAtivo] = useState(false);

  useEffect(() => setAtivo(lerPreferencia()), []);

  useEffect(() => {
    const raiz = document.documentElement;
    if (ativo) raiz.setAttribute(ATRIBUTO, "");
    else raiz.removeAttribute(ATRIBUTO);
  }, [ativo]);

  const alternar = useCallback(() => {
    setAtivo((anterior) => {
      salvarPreferencia(!anterior);
      return !anterior;
    });
  }, []);

  return <Contexto.Provider value={{ ativo, alternar }}>{children}</Contexto.Provider>;
}

export function useModoCalmo(): ModoCalmoContexto {
  return useContext(Contexto);
}
