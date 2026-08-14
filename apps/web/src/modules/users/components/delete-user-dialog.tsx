"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem } from "@/types/api";
import { ApiError } from "@/utils/errors";

type DeleteUserDialogProps = {
  user: AdminUserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onDeleted,
}: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await adminUsersService.delete(user.id);
      toast.success("Usuário excluído com sucesso.");
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível excluir o usuário.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 id="delete-user-title" className="text-lg font-semibold">
          Excluir usuário
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tem certeza que deseja excluir{" "}
          <strong>{user.name ?? user.email ?? "este usuário"}</strong>? Esta ação
          não pode ser desfeita.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Excluindo…
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
