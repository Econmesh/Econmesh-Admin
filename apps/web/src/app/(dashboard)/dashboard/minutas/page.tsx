"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CONTRACT_PROPOSAL_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  formatProposalDate,
} from "@/modules/minutas/constants";
import { adminContractProposalsService } from "@/services/admin/contract-proposals.service";
import { ApiError } from "@/utils/errors";
import type { ContractProposalListItem } from "@/types/api";

export default function AdminMinutasPage() {
  const [items, setItems] = useState<ContractProposalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    void adminContractProposalsService
      .list({ page: 1, page_size: 50 })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        toast.error(
          err instanceof ApiError
            ? err.message
            : "Não foi possível carregar as minutas.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Minutas</h1>
        <p className="text-sm text-muted-foreground">
          Consulta das minutas geradas nas conversas · {total} minuta(s)
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma minuta encontrada.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/minutas/${item.id}` as Route}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Conversa {item.conversation_id.slice(0, 8)}…
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {CONTRACT_TYPE_LABELS[item.contract_type] ?? item.contract_type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {CONTRACT_PROPOSAL_STATUS_LABELS[item.status] ?? item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatProposalDate(item.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
