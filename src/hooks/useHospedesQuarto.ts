import { useCallback, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export interface HospedesQuarto {
  adultos: number;
  criancas: number;
  total: number;
  capacidadeTotal: number;
  maxAdultos: number;
  maxCriancas: number;
  definirHospedes: (adultos: number, criancas: number) => void;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

export function useHospedesQuarto(
  capacidadeTotal: number,
  capacidadeAdultos: number | null,
  capacidadeCriancas: number | null,
): HospedesQuarto {
  const search = useSearch({ from: "/quartos/$id" });
  const navigate = useNavigate({ from: "/quartos/$id" });

  const maxAdultos = capacidadeAdultos ?? capacidadeTotal;
  const maxCriancas = capacidadeCriancas ?? capacidadeTotal;

  const adultos = clamp(
    search.adultos ?? 1,
    1,
    Math.max(1, Math.min(maxAdultos, capacidadeTotal)),
  );
  const criancas = clamp(
    search.criancas ?? 0,
    0,
    Math.max(0, Math.min(maxCriancas, capacidadeTotal - adultos)),
  );

  const definirHospedes = useCallback(
    (novoAdultos: number, novoCriancas: number) => {
      navigate({
        search: (prev) => ({
          ...prev,
          adultos: novoAdultos !== 1 ? novoAdultos : undefined,
          criancas: novoCriancas !== 0 ? novoCriancas : undefined,
        }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  useEffect(() => {
    if ((search.adultos ?? 1) !== adultos || (search.criancas ?? 0) !== criancas) {
      definirHospedes(adultos, criancas);
    }
  }, [search.adultos, search.criancas, adultos, criancas, definirHospedes]);

  return {
    adultos,
    criancas,
    total: adultos + criancas,
    capacidadeTotal,
    maxAdultos,
    maxCriancas,
    definirHospedes,
  };
}
