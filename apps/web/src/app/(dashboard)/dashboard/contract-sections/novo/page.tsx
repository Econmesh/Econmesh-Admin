"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ContractSectionForm } from "@/modules/contract-sections/components/contract-section-form";
import type { ContractSectionFormValues } from "@/modules/contract-sections/schemas";
import { adminContractSectionsService } from "@/services/admin/contract-sections.service";

export default function NovaContractSectionPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/contract-sections" className="hover:underline">
            Seções contratuais
          </Link>
          {" / "}Nova seção
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Criar seção padrão</h1>
      </div>

      <ContractSectionForm
        mode="create"
        submitLabel="Criar seção"
        onSubmit={async (values: ContractSectionFormValues) => {
          const section = await adminContractSectionsService.create({
            ...values,
            contract_type: "todos",
          });
          toast.success("Seção criada com sucesso.");
          router.push(`/dashboard/contract-sections/${section.id}`);
        }}
      />
    </div>
  );
}
