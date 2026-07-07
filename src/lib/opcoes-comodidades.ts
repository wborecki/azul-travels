import { Wifi, Car, Snowflake, Tv, Refrigerator, ChefHat, type LucideIcon } from "lucide-react";

export interface ComodidadeOpcao {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const COMODIDADES_OPCAO: ComodidadeOpcao[] = [
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "estacionamento", label: "Estacionamento", icon: Car },
  { key: "ar_condicionado", label: "Ar-condicionado", icon: Snowflake },
  { key: "tv", label: "TV", icon: Tv },
  { key: "frigobar", label: "Frigobar/geladeira", icon: Refrigerator },
  { key: "cozinha", label: "Cozinha/kitchenette", icon: ChefHat },
];

export const COMODIDADE_POR_KEY: Record<string, ComodidadeOpcao> = Object.fromEntries(
  COMODIDADES_OPCAO.map((c) => [c.key, c]),
);
