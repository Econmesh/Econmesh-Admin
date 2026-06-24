"use client";

import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { UserForm } from "@/modules/users/components/user-form";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function UsuarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserListItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUsersService.get(params.id);
      setUser(data);
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-lg rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/usuarios" className="hover:underline">
            Usuários
          </Link>
          {" / "}
          {user.name ?? user.email}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Editar usuário</h1>
      </div>

      <UserForm
        mode="edit"
        initialData={user}
        submitLabel="Salvar alterações"
        onSubmit={async (values) => {
          await adminUsersService.update(user.id, values);
          toast.success("Usuário atualizado.");
          router.push("/dashboard/usuarios");
        }}
      />
    </div>
  );
}
