"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ModeToggle } from "@/components/mode-toggle";
import { adminPlatformSettingsService } from "@/services/admin/platform-settings.service";
import type { PlatformSettings } from "@/types/api";
import { ApiError } from "@/utils/errors";

function PlatformSettingsForm({ initialData }: { initialData: PlatformSettings }) {
  const [loading, setLoading] = useState(false);
  const [required, setRequired] = useState(initialData.require_signature_authorization);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const updated = await adminPlatformSettingsService.update({
        require_signature_authorization: required,
      });
      setRequired(updated.require_signature_authorization);
      toast.success("Configurações salvas.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar as configurações.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />
        <span>
          <span className="font-medium">
            Tornar obrigatório o anexo do documento de autorização de assinatura para empresas.
          </span>
          <span className="mt-1 block text-muted-foreground">
            Desligado: o documento é opcional e os acordos seguem normalmente. Ligado: o perfil
            fica incompleto para criar, enviar ou assinar acordos até o documento ser enviado e
            aprovado.
          </span>
        </span>
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    void adminPlatformSettingsService
      .get()
      .then(setSettings)
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as configurações.",
        );
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferências da conta e regras globais da plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Escolha o tema do painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da plataforma</CardTitle>
          <CardDescription>
            Obrigatoriedade do documento de autorização de assinatura (procuração / contrato
            social).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings ? (
            <PlatformSettingsForm initialData={settings} />
          ) : (
            <Skeleton className="h-32 rounded-xl" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
