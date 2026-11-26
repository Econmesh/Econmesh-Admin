"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { isDmcPathAllowed } from "@/modules/dashboard/constants/nav-items";

export function DmcPathGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const blocked = user?.role === "dmc_agent" && !isDmcPathAllowed(pathname);

  useEffect(() => {
    if (blocked) router.replace("/dashboard");
  }, [blocked, router]);

  if (blocked) return null;
  return <>{children}</>;
}
