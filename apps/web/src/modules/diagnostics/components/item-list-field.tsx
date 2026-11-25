"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { Check, Package, Pencil, Plus, Recycle, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ItemStatusBadge } from "@/modules/diagnostics/components/item-accordion";
import { questionLabel, type LocalStepProgress } from "@/modules/diagnostics/lib/rules";
import type {
  DiagnosticItem,
  DiagnosticItemKindMeta,
  DiagnosticQuestion,
} from "@/services/dmc/diagnostics.service";

export type ItemDraft = { name: string; description: string };

/**
 * Cadastro de produtos (1.1) ou resíduos (1.7): listagem com adicionar, editar
 * e excluir. Cada item gera automaticamente suas perguntas nos eixos.
 */
export function ItemListField({
  question,
  meta,
  items,
  progress,
  error,
  readOnly,
  onAdd,
  onUpdate,
  onDelete,
}: {
  question: DiagnosticQuestion;
  meta: DiagnosticItemKindMeta;
  items: DiagnosticItem[];
  progress: Map<string, LocalStepProgress>;
  error?: string;
  readOnly?: boolean;
  /** Retorna a mensagem de erro (ex.: nome duplicado) ou ``null`` em caso de sucesso. */
  onAdd: (draft: ItemDraft) => Promise<string | null>;
  onUpdate: (itemId: string, draft: ItemDraft) => Promise<string | null>;
  onDelete: (item: DiagnosticItem) => void;
}) {
  const id = `question-${question.id}`;
  const label = meta.label.toLowerCase();
  const Icon = meta.kind === "product" ? Package : Recycle;
  const [draft, setDraft] = useState<ItemDraft>({ name: "", description: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ItemDraft>({ name: "", description: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const limitReached = items.length >= meta.max_items;

  async function submitAdd(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setAddError(`Informe o nome do ${label}.`);
      return;
    }
    setSaving(true);
    const message = await onAdd(draft);
    setSaving(false);
    setAddError(message);
    if (!message) setDraft({ name: "", description: "" });
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    if (!editDraft.name.trim()) {
      setEditError(`Informe o nome do ${label}.`);
      return;
    }
    setSaving(true);
    const message = await onUpdate(editingId, editDraft);
    setSaving(false);
    setEditError(message);
    if (!message) setEditingId(null);
  }

  function startEdit(item: DiagnosticItem) {
    setEditingId(item.id);
    setEditDraft({ name: item.name, description: item.description ?? "" });
    setEditError(null);
  }

  return (
    <div id={`${id}-field`} className="scroll-mt-24 space-y-3 rounded-lg p-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p id={`${id}-label`} className="text-sm font-medium leading-snug">
          {questionLabel(question)}
          {question.required && !readOnly ? (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </p>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? meta.label.toLowerCase() : meta.plural.toLowerCase()}{" "}
          {items.length === 1 ? "cadastrado" : "cadastrados"}
        </span>
      </div>
      {question.help_text ? (
        <p className="text-xs text-muted-foreground">{question.help_text}</p>
      ) : null}

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
          <Icon className="size-5 shrink-0" aria-hidden />
          Nenhum {label} cadastrado ainda.
        </div>
      ) : (
        <ul aria-labelledby={`${id}-label`} className="divide-y rounded-lg border">
          {items.map((item, index) => (
            <li key={item.id} className="px-4 py-3">
              {editingId === item.id ? (
                <form onSubmit={(event) => void submitEdit(event)} className="space-y-2">
                  <Input
                    aria-label={`Nome do ${label}`}
                    value={editDraft.name}
                    maxLength={120}
                    autoFocus
                    onChange={(event) => setEditDraft((d) => ({ ...d, name: event.target.value }))}
                  />
                  <Textarea
                    aria-label={meta.description_label}
                    placeholder={meta.description_label}
                    value={editDraft.description}
                    maxLength={2000}
                    rows={2}
                    className="min-h-14"
                    onChange={(event) =>
                      setEditDraft((d) => ({ ...d, description: event.target.value }))
                    }
                  />
                  {editError ? (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {editError}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      <Check aria-hidden />
                      Salvar
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X aria-hidden />
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description ? (
                      <p className="whitespace-pre-line text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <ItemStatusBadge progress={progress.get(item.id)} />
                  {!readOnly ? (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Editar ${label} ${item.name}`}
                        onClick={() => startEdit(item)}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Excluir ${label} ${item.name}`}
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly ? (
        limitReached ? (
          <p className="text-xs text-muted-foreground">
            Limite de {meta.max_items} {meta.plural.toLowerCase()} atingido.
          </p>
        ) : (
          <form
            onSubmit={(event) => void submitAdd(event)}
            className="space-y-2 rounded-lg border border-dashed p-3"
          >
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-start">
              <Input
                id={id}
                aria-label={`Nome do ${label}`}
                aria-invalid={!!(error || addError) || undefined}
                placeholder={`Nome do ${label}`}
                value={draft.name}
                maxLength={120}
                onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
              />
              <Input
                aria-label={meta.description_label}
                placeholder={meta.description_label}
                value={draft.description}
                maxLength={2000}
                onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
              />
              <Button type="submit" disabled={saving}>
                <Plus aria-hidden />
                Adicionar {label}
              </Button>
            </div>
            {addError ? (
              <p className="text-xs font-medium text-destructive" role="alert">
                {addError}
              </p>
            ) : null}
          </form>
        )
      ) : null}

      {error && items.length === 0 ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          Cadastre ao menos um {label}.
        </p>
      ) : null}
    </div>
  );
}
