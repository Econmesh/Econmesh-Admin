import {
  Bell,
  Building2,
  CreditCard,
  FileStack,
  FileText,
  Handshake,
  Headphones,
  LayoutDashboard,
  MessageCircle,
  Receipt,
  ScrollText,
  Settings,
  Target,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

import type { Role } from "@/types/api";

export type DashboardNavItem = {
  href: Route;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  roles?: Role[];
};

const DMC_AND_ADMIN: Role[] = ["admin", "dmc_agent"];

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Início",
    icon: LayoutDashboard,
    roles: DMC_AND_ADMIN,
  },
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
    roles: DMC_AND_ADMIN,
  },
  {
    href: "/dashboard/oportunidades",
    label: "Oportunidades",
    shortLabel: "Oportun.",
    icon: Target,
    roles: DMC_AND_ADMIN,
  },
  {
    href: "/dashboard/conversas",
    label: "Conversas",
    shortLabel: "Conversas",
    icon: MessageCircle,
    roles: DMC_AND_ADMIN,
  },
  {
    href: "/dashboard/minutas",
    label: "Minutas",
    shortLabel: "Minutas",
    icon: ScrollText,
  },
  { href: "/dashboard/acordos", label: "Acordos", shortLabel: "Acordos", icon: Handshake },
  {
    href: "/dashboard/contract-sections",
    label: "Seções contratuais",
    shortLabel: "Seções",
    icon: FileStack,
  },
  {
    href: "/dashboard/suporte",
    label: "Suporte",
    shortLabel: "Suporte",
    icon: Headphones,
    roles: DMC_AND_ADMIN,
  },
  { href: "/dashboard/blog", label: "Blog", shortLabel: "Blog", icon: FileText },
  {
    href: "/dashboard/planos" as Route,
    label: "Planos",
    shortLabel: "Planos",
    icon: CreditCard,
  },
  {
    href: "/dashboard/assinaturas" as Route,
    label: "Assinaturas",
    shortLabel: "Assin.",
    icon: Receipt,
  },
  {
    href: "/dashboard/cupons" as Route,
    label: "Cupons",
    shortLabel: "Cupons",
    icon: TicketPercent,
  },
  {
    href: "/dashboard/cobranca/configuracoes" as Route,
    label: "Cobrança",
    shortLabel: "Cobrança",
    icon: Settings,
  },
  {
    href: "/dashboard/notificacoes",
    label: "Notificações",
    shortLabel: "Notif.",
    icon: Bell,
    roles: DMC_AND_ADMIN,
  },
];

export function navItemsForRole(role: Role | undefined): DashboardNavItem[] {
  return DASHBOARD_NAV_ITEMS.filter((item) => {
    if (!item.roles) return role === "admin";
    return role != null && item.roles.includes(role);
  });
}

export function isDmcPathAllowed(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname === "/profile") return true;
  const allowed = [
    "/dashboard/empresas",
    "/dashboard/oportunidades",
    "/dashboard/conversas",
    "/dashboard/suporte",
    "/dashboard/notificacoes",
  ];
  const inModule = allowed.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!inModule) return false;
  if (pathname.includes("/nova") || pathname.includes("/editar") || pathname.includes("/grupos")) {
    return false;
  }
  return true;
}

export function isDashboardNavActive(pathname: string, href: Route): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
