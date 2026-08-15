"use client";

import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { GrantAccessForm } from "@/modules/billing/components/grant-access-form";
import { adminBillingService } from "@/services/admin/billing.service";
import type { AdminAccessGrantTarget } from "@/types/api";
import { ApiError } from "@/utils/errors";

type GrantAccessDialogProps = {
  userId?: string;
  companyId?: string;
  userLabel?: string;
  onClose: () => void;
  onGranted: () => void;
};

function targetMatches(item: AdminAccessGrantTarget, query: string): boolean {
  const haystack = [
    item.user_name,
    item.user_email,
    item.user_phone,
    item.company_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function GrantAccessDialog({
  userId,
  companyId,
  userLabel,
  onClose,
  onGranted,
}: GrantAccessDialogProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminAccessGrantTarget[]>([]);
  const [selected, setSelected] = useState<AdminAccessGrantTarget | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await adminBillingService.searchAccessGrantTargets("");
        if (cancelled) return;
        setItems(response.items);
        const match = response.items.find(
          (item) =>
            (userId && item.user_id === userId) ||
            (companyId && item.company_id === companyId),
        );
        if (match) {
          setSelected(match);
        } else if (userId) {
          setSelected({
            user_id: userId,
            company_id: companyId ?? "",
            user_name: userLabel ?? null,
            user_email: null,
            user_phone: null,
            company_name: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar os usuários.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, userId, userLabel]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => targetMatches(item, term));
  }, [items, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grant-access-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="pr-6">
            <h2 id="grant-access-title" className="text-lg font-semibold">
              Liberar acesso excepcional
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o usuário e informe o prazo de acesso.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant-access-search">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="grant-access-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, e-mail, telefone ou empresa"
                className="pl-7"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              {loading ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">Carregando usuários…</p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                <ul>
                  {filtered.map((item) => {
                    const isSelected =
                      selected?.company_id === item.company_id &&
                      selected?.user_id === item.user_id;
                    return (
                      <li key={`${item.company_id}-${item.user_id}`}>
                        <button
                          type="button"
                          className={`flex w-full flex-col items-start gap-0.5 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted ${
                            isSelected ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelected(item)}
                        >
                          <span className="text-sm font-medium">
                            {item.user_name || item.user_email || item.user_id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {[item.user_email, item.user_phone].filter(Boolean).join(" · ") ||
                              "Sem contato"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Empresa responsável: {item.company_name || "—"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {selected ? (
            <GrantAccessForm
              userId={selected.user_id}
              companyId={selected.company_id || undefined}
              onGranted={() => {
                onGranted();
                onClose();
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione um usuário na lista para definir o prazo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
