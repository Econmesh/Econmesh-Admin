"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { BRAZILIAN_STATES } from "@/modules/companies/schemas";
import { adminPlatformSettingsService } from "@/services/admin/platform-settings.service";
import type { ForoFillMode, PlatformSettings } from "@/types/api";
import { ApiError } from "@/utils/errors";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ForoSectionConfigProps = {
  settings: PlatformSettings;
  onSaved: (settings: PlatformSettings) => void;
};

export function ForoSectionConfig({ settings, onSaved }: ForoSectionConfigProps) {
  const [fillMode, setFillMode] = useState<ForoFillMode>(settings.foro_fill_mode ?? "company");
  const [city, setCity] = useState(settings.foro_city ?? "");
  const [state, setState] = useState(settings.foro_state ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fillMode === "admin" && (!city.trim() || !state)) {
      toast.error("Informe cidade e estado da comarca.");
      return;
    }
    setSaving(true);
    try {
      const updated = await adminPlatformSettingsService.update({
        foro_fill_mode: fillMode,
        foro_city: fillMode === "admin" ? city.trim() : settings.foro_city,
        foro_state: fillMode === "admin" ? state : settings.foro_state,
      });
      setFillMode(updated.foro_fill_mode);
      setCity(updated.foro_city ?? "");
      setState(updated.foro_state ?? "");
      onSaved(updated);
      toast.success("Configuração do foro salva.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar a configuração do foro.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Quem preenche a comarca</legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="foro_fill_mode"
            className="mt-1"
            checked={fillMode === "company"}
            onChange={() => setFillMode("company")}
          />
          <span>
            <span className="font-medium">Empresas preenchem a comarca</span>
            <span className="mt-0.5 block text-muted-foreground">
              A empresa ofertante informa cidade e estado na minuta. Obrigatório
              antes de gerar o PDF.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="foro_fill_mode"
            className="mt-1"
            checked={fillMode === "admin"}
            onChange={() => setFillMode("admin")}
          />
          <span>
            <span className="font-medium">Admin preenche obrigatoriamente</span>
            <span className="mt-0.5 block text-muted-foreground">
              Todas as minutas usam a comarca definida abaixo. As empresas não
              podem alterar.
            </span>
          </span>
        </label>
      </fieldset>

      {fillMode === "admin" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Cidade</span>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
              placeholder="Comarca"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Estado</span>
            <select
              className={SELECT_CLASS}
              value={state}
              onChange={(event) => setState(event.target.value)}
              required
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Salvando..." : "Salvar foro"}
      </Button>
    </form>
  );
}
