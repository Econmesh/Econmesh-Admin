import {
  Bell,
  Building2,
  FileText,
  Handshake,
  Headphones,
  LayoutDashboard,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

export type DashboardNavItem = {
  href: Route;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Início", icon: LayoutDashboard },
  {
    href: "/dashboard/usuarios",
    label: "Usuários",
    shortLabel: "Usuários",
    icon: Users,
  },
  {
    href: "/dashboard/empresas",
    label: "Empresas",
    shortLabel: "Empresas",
    icon: Building2,
  },
  {
    href: "/dashboard/oportunidades",
    label: "Oportunidades",
    shortLabel: "Oportun.",
    icon: Target,
  },
  { href: "/dashboard/acordos", label: "Acordos", shortLabel: "Acordos", icon: Handshake },
  { href: "/dashboard/suporte", label: "Suporte", shortLabel: "Suporte", icon: Headphones },
  { href: "/dashboard/blog", label: "Blog", shortLabel: "Blog", icon: FileText },
  {
    href: "/dashboard/notificacoes",
    label: "Notificações",
    shortLabel: "Notif.",
    icon: Bell,
  },
];

export function isDashboardNavActive(pathname: string, href: Route): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
