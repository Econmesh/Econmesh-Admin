"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CouponForm } from "@/modules/billing/components/coupon-form";
import { adminBillingService } from "@/services/admin/billing.service";

export default function NovoCupomPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={"/dashboard/cupons" as Route} className="hover:underline">
            Cupons
          </Link>
          {" / "}Novo cupom
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastrar cupom</h1>
      </div>
      <CouponForm
        mode="create"
        submitLabel="Criar cupom"
        onSubmit={async (values) => {
          await adminBillingService.createCoupon({
            code: values.code,
            discount_type: values.discount_type,
            discount_value: values.discount_value,
            valid_until: values.valid_until
              ? new Date(`${values.valid_until}T23:59:59`).toISOString()
              : null,
            max_uses: values.max_uses?.trim() ? Number(values.max_uses) : null,
            is_active: values.is_active,
          });
          toast.success("Cupom criado.");
          router.push("/dashboard/cupons" as Route);
        }}
      />
    </div>
  );
}
