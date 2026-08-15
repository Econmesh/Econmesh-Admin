"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { adminBillingService } from "@/services/admin/billing.service";
import type { BillingCoupon } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<BillingCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBillingService.listCoupons();
      setCoupons(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível carregar os cupons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cupons</h1>
          <p className="text-sm text-muted-foreground">Crie cupons de desconto para assinaturas.</p>
        </div>
        <Link href={"/dashboard/cupons/novo" as Route}>
          <Button>
            <Plus className="size-4" />
            Novo cupom
          </Button>
        </Link>
      </div>
      {loading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <div className="space-y-2">
          {coupons.map((coupon) => (
            <Link
              key={coupon.id}
              href={`/dashboard/cupons/${coupon.id}/editar` as Route}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 hover:border-primary"
            >
              <div>
                <p className="font-semibold">{coupon.code}</p>
                <p className="text-sm text-muted-foreground">
                  {coupon.discount_type === "PERCENTAGE"
                    ? `${coupon.discount_value}%`
                    : `R$ ${coupon.discount_value}`}
                  {" · "}
                  {coupon.used_count}
                  {coupon.max_uses ? `/${coupon.max_uses}` : ""} usos
                </p>
              </div>
              <Badge variant={coupon.is_active ? "success" : "secondary"}>
                {coupon.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </Link>
          ))}
          {coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
