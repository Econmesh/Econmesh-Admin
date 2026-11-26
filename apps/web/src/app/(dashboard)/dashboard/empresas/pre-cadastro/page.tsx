"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { DmcPreRegistrationForm } from "@/modules/dmc/components/dmc-pre-registration-form";
import { dmcAgentService } from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

export default function PreCadastroEmpresaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isDmc = user?.role === "dmc_agent";

  useEffect(() => {
    if (user && !isDmc) router.replace("/dashboard/empresas");
  }, [user, isDmc, router]);

  if (!isDmc) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/empresas" className="hover:underline">
            Empresas
          </Link>
          {" / "}Pré-cadastro
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Pré-cadastro de empresa</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A empresa entra na sua carteira sem usuário e sem acesso à plataforma. Quando o
          responsável fizer o cadastro no app e informar a razão social ou o CNPJ, estes dados
          aparecem como sugestão e preenchem o formulário automaticamente.
        </p>
      </div>
      <DmcPreRegistrationForm
        submitLabel="Salvar pré-cadastro"
        onCancel={() => router.push("/dashboard/empresas")}
        onSubmit={async (payload) => {
          try {
            const company = await dmcAgentService.preRegisterCompany(payload);
            toast.success("Pré-cadastro salvo.");
            router.push(`/dashboard/empresas/${company.id}`);
          } catch (error) {
            const handledByForm = ["tax_id_exists", "validation_error"];
            if (error instanceof ApiError && handledByForm.includes(error.code)) throw error;
            toast.error(error instanceof ApiError ? error.message : "Falha ao salvar.");
          }
        }}
      />
    </div>
  );
}
