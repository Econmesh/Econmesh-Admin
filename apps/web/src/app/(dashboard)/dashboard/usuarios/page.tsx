"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { UserList } from "@/modules/users/components/user-list";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUsersService.list({ page_size: 100 });
      setUsers(data.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar os usuários.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e administradores da plataforma.
          </p>
        </div>
        <Link href="/dashboard/usuarios/novo" className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Novo usuário
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <UserList users={users} onDeleted={loadUsers} />
      )}
    </div>
  );
}
