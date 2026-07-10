import type { LinkProps } from "@tanstack/react-router";
import {
  BedDouble,
  Building2,
  CalendarCheck,
  HeartPulse,
  MessagesSquare,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/enums";

export interface AccountNavItem {
  label: string;
  to: LinkProps["to"];
  icon: LucideIcon;
}

export interface AccountNavSection {
  title?: string;
  items: AccountNavItem[];
}

const FAMILIA_ITEMS: AccountNavItem[] = [
  { label: "Minha conta", to: "/minha-conta", icon: User },
  { label: "Perfil do meu filho", to: "/minha-conta/perfil", icon: HeartPulse },
  { label: "Conversas", to: "/minha-conta/mensagens", icon: MessagesSquare },
  { label: "Reservas", to: "/minha-conta/reservas", icon: CalendarCheck },
];

const ESTABELECIMENTO_ITEMS: AccountNavItem[] = [
  { label: "Meu estabelecimento", to: "/meu-estabelecimento", icon: Building2 },
  { label: "Reservas", to: "/meu-estabelecimento/reservas", icon: CalendarCheck },
  { label: "Mensagens", to: "/meu-estabelecimento/mensagens", icon: MessagesSquare },
  { label: "Quartos", to: "/meu-estabelecimento/itens", icon: BedDouble },
];

const ADMIN_ITEMS: AccountNavItem[] = [{ label: "Painel Admin", to: "/admin", icon: ShieldCheck }];

export function getAccountNav(roles: AppRole[]): AccountNavSection[] {
  const distinct = Array.from(new Set(roles));
  const multiple = distinct.length >= 2;
  const sections: AccountNavSection[] = [];
  if (distinct.includes("user")) {
    sections.push({ title: multiple ? "Família" : undefined, items: FAMILIA_ITEMS });
  }
  if (distinct.includes("estabelecimento")) {
    sections.push({
      title: multiple ? "Estabelecimento" : undefined,
      items: ESTABELECIMENTO_ITEMS,
    });
  }
  if (distinct.includes("admin")) {
    sections.push({ title: multiple ? "Administração" : undefined, items: ADMIN_ITEMS });
  }
  return sections;
}
