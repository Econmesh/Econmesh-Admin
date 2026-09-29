"use client";

import { cn } from "@econmesh-admin/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isDashboardNavActive,
  navItemsForRole,
} from "../constants/nav-items";
import { useAuth } from "@/hooks/use-auth";

export function DashboardMobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = navItemsForRole(user?.role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-3 mb-3 rounded-2xl border border-border/80 bg-card/95 shadow-lg backdrop-blur-md supports-[padding:max(0px)]:mb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className={items.length > 5 ? "grid grid-cols-3 gap-1 p-1.5" : "grid grid-cols-5 gap-1 p-1.5"}>
          {items.map(({ href, shortLabel, icon: Icon }) => {
            const active = isDashboardNavActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate text-[10px] font-medium leading-tight sm:text-xs">
                  {shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
