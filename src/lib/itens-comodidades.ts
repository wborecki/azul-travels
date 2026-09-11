import { Wifi, Car, Snowflake, Tv, Refrigerator, ChefHat, type LucideIcon } from "lucide-react";

export interface ComodidadeItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const COMODIDADES_ITEM: ComodidadeItem[] = [
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "estacionamento", label: "Estacionamento", icon: Car },
  { key: "ar_condicionado", label: "Ar-condicionado", icon: Snowflake },
  { key: "tv", label: "TV", icon: Tv },
  { key: "frigobar", label: "Frigobar/geladeira", icon: Refrigerator },
  { key: "cozinha", label: "Cozinha/kitchenette", icon: ChefHat },
];

export const COMODIDADE_POR_KEY: Record<string, ComodidadeItem> = Object.fromEntries(
  COMODIDADES_ITEM.map((c) => [c.key, c]),
);
