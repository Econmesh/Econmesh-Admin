"use client";

import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyForm } from "@/modules/companies/components/company-form";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type { Company } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarEmpresaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompany = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCompaniesService.get(params.id);
      setCompany(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a empresa.",
      );
      router.push("/dashboard/empresas");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/empresas" className="hover:underline">
            Empresas
          </Link>
          {" / "}
          <Link href={`/dashboard/empresas/${company.id}`} className="hover:underline">
            {company.legal_name}
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Editar empresa</h1>
        <p className="text-sm text-muted-foreground">
          Atualize os dados da empresa.
        </p>
      </div>

      <CompanyForm
        mode="edit"
        initialData={company}
        submitLabel="Salvar alterações"
        onSubmit={async (payload, files) => {
          await adminCompaniesService.update(company.id, payload);
          if (files.operating_license) {
            await adminCompaniesService.uploadDocument(
              company.id,
              "operating_license",
              files.operating_license,
            );
          }
          if (files.mtr) {
            await adminCompaniesService.uploadDocument(company.id, "mtr", files.mtr);
          }
          if (files.signature_authorization) {
            await adminCompaniesService.uploadDocument(
              company.id,
              "signature_authorization",
              files.signature_authorization,
            );
          }
          toast.success("Empresa atualizada com sucesso.");
          router.push(`/dashboard/empresas/${company.id}`);
        }}
      />
    </div>
  );
}
