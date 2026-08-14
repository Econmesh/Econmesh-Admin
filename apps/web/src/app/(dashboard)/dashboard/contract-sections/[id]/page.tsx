"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ContractSectionForm } from "@/modules/contract-sections/components/contract-section-form";
import type { ContractSectionFormValues } from "@/modules/contract-sections/schemas";
import { adminContractSectionsService } from "@/services/admin/contract-sections.service";
import type { ContractSection } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarContractSectionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [section, setSection] = useState<ContractSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminContractSectionsService.get(params.id);
      setSection(data);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a seção.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!section) return;
    setDeleting(true);
    try {
      await adminContractSectionsService.delete(section.id);
      toast.success("Seção removida.");
      router.push("/dashboard/contract-sections");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível remover.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (!section) {
    return <p className="text-sm text-muted-foreground">Seção não encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/contract-sections" className="hover:underline">
            Seções contratuais
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{section.title}</h1>
      </div>

      <ContractSectionForm
        mode="edit"
        initialData={section}
        submitLabel="Salvar alterações"
        onSubmit={async (values: ContractSectionFormValues) => {
          const updated = await adminContractSectionsService.update(section.id, values);
          setSection(updated);
          toast.success("Seção atualizada.");
        }}
      />

      <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
        Remover seção
      </Button>
    </div>
  );
}
