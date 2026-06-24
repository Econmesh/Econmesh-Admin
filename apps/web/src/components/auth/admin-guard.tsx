"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";

import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { useAuth } from "@/hooks/use-auth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, status, signOutUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (user.role !== "admin") {
      toast.error("Acesso restrito a administradores.");
      void signOutUser();
      router.replace("/login?reason=admin_required");
    }
  }, [status, user, signOutUser, router]);

  if (status === "loading") {
    return <PageSkeleton />;
  }

  if (status !== "authenticated" || user?.role !== "admin") {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
