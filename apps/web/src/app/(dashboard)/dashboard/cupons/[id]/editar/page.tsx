"use client";

import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CouponForm } from "@/modules/billing/components/coupon-form";
import { adminBillingService } from "@/services/admin/billing.service";
import type { BillingCoupon } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarCupomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [coupon, setCoupon] = useState<BillingCoupon | null>(null);

  useEffect(() => {
    void adminBillingService
      .getCoupon(params.id)
      .then(setCoupon)
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.message : "Cupom não encontrado.");
        router.push("/dashboard/cupons" as Route);
      });
  }, [params.id, router]);

  if (!coupon) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={"/dashboard/cupons" as Route} className="hover:underline">
            Cupons
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Editar cupom</h1>
      </div>
      <CouponForm
        mode="edit"
        initialData={coupon}
        submitLabel="Salvar alterações"
        onSubmit={async (values) => {
          await adminBillingService.updateCoupon(coupon.id, {
            discount_type: values.discount_type,
            discount_value: values.discount_value,
            valid_until: values.valid_until
              ? new Date(`${values.valid_until}T23:59:59`).toISOString()
              : null,
            max_uses: values.max_uses?.trim() ? Number(values.max_uses) : null,
            is_active: values.is_active,
          });
          toast.success("Cupom atualizado.");
          router.push("/dashboard/cupons" as Route);
        }}
      />
    </div>
  );
}
