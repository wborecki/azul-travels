import {
  Camera,
  Heart,
  Home,
  Bell,
  ListChecks,
  MessageCircle,
  Gift,
  ShieldCheck,
  Award,
  Star,
} from "lucide-react";
import type { ReactNode } from "react";

export interface BadgeDef {
  icon: ReactNode;
  label: string;
  className: string; // tailwind classes
}

export const SELO_BADGES = {
  selo_azul: {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    label: "Selo Azul",
    className: "bg-primary text-primary-foreground",
  },
  selo_governamental: {
    icon: <Award className="h-3.5 w-3.5" />,
    label: "Certificação Governamental",
    className: "bg-success text-success-foreground",
  },
  selo_privado: {
    icon: <Star className="h-3.5 w-3.5" />,
    label: "Selo Privado",
    className: "bg-amarelo text-amarelo-foreground",
  },
  tour_360: {
    icon: <Camera className="h-3.5 w-3.5" />,
    label: "Tour 360°",
    className: "bg-amarelo text-amarelo-foreground",
  },
  beneficio_tea: {
    icon: <Gift className="h-3.5 w-3.5" />,
    label: "Benefício TEA",
    className: "bg-success text-success-foreground",
  },
} as const;

export const RECURSO_BADGES = {
  tem_sala_sensorial: {
    icon: <Home className="h-3.5 w-3.5" />,
    label: "Sala Sensorial",
    className: "bg-roxo-suave text-roxo-suave-foreground",
  },
  tem_concierge_tea: {
    icon: <Heart className="h-3.5 w-3.5" />,
    label: "Concierge TEA",
    className: "bg-secondary text-secondary-foreground",
  },
  tem_checkin_antecipado: {
    icon: <Bell className="h-3.5 w-3.5" />,
    label: "Check-in Antecipado",
    className: "bg-azul-claro text-primary",
  },
  tem_fila_prioritaria: {
    icon: <ListChecks className="h-3.5 w-3.5" />,
    label: "Fila Prioritária",
    className: "bg-warning text-warning-foreground",
  },
  tem_cardapio_visual: {
    icon: <ListChecks className="h-3.5 w-3.5" />,
    label: "Cardápio Visual",
    className: "bg-azul-claro text-primary",
  },
  tem_caa: {
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    label: "CAA Disponível",
    className: "bg-teal-claro text-secondary",
  },
} as const;

export function Pill({
  icon,
  label,
  className,
}: BadgeDef) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-tight ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
