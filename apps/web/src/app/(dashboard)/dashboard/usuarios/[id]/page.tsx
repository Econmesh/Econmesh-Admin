"use client";

import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { UserDetailView } from "@/modules/users/components/user-detail-view";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem, UserProfile } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function UsuarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<AdminUserListItem | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const [account, profileData] = await Promise.all([
        adminUsersService.get(params.id),
        adminUsersService.getProfile(params.id),
      ]);
      setUser(account);
      setProfile(profileData);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar o usuário.",
      );
      router.push("/dashboard/usuarios");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/usuarios" className="hover:underline">
          Usuários
        </Link>
        {" / "}
        {user.name ?? user.email}
      </p>

      <UserDetailView
        user={user}
        profile={profile}
        canDelete={currentUser?.id !== user.id}
        onDeleted={() => router.push("/dashboard/usuarios")}
      />
    </div>
  );
}
