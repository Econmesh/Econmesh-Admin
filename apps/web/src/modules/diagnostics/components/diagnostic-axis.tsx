"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { ArrowUpRight, Info, Lock, Wrench } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { DiagnosticQuestionField } from "@/modules/diagnostics/components/diagnostic-question";
import { ItemAccordion } from "@/modules/diagnostics/components/item-accordion";
import { ItemListField, type ItemDraft } from "@/modules/diagnostics/components/item-list-field";
import { ProgressIndicator } from "@/modules/diagnostics/components/progress-indicator";
import { displayAnswer } from "@/modules/diagnostics/components/question-input";
import {
  instancesProgress,
  isAnswered,
  itemsOf,
  questionLabel,
  responseKey,
  type AnswerMap,
  type LocalStepProgress,
  type QuestionInstance,
} from "@/modules/diagnostics/lib/rules";
import type {
  AnswerValue,
  DiagnosticCatalog,
  DiagnosticItem,
  DiagnosticItemReference,
  DiagnosticQuestion,
  DiagnosticResponse,
  DiagnosticSection,
  DiagnosticStep,
  ItemKind,
} from "@/services/dmc/diagnostics.service";

function progressText(progress: LocalStepProgress): string {
  const parts = [
    `${progress.requiredAnswered} de ${progress.requiredTotal} obrigatórias preenchidas`,
  ];
  if (progress.optionalTotal > 0) {
    parts.push(`${progress.optionalAnswered} de ${progress.optionalTotal} opcionais`);
  }
  if (progress.notApplicable > 0) {
    parts.push(
      `${progress.notApplicable} não ${progress.notApplicable === 1 ? "aplicável" : "aplicáveis"}`,
    );
  }
  return parts.join(" · ");
}

export type ItemActions = {
  progress: Map<string, LocalStepProgress>;
  onAdd: (kind: ItemKind, draft: ItemDraft) => Promise<string | null>;
  onUpdate: (itemId: string, draft: ItemDraft) => Promise<string | null>;
  onDelete: (item: DiagnosticItem) => void;
};

/** Conteúdo de uma etapa/eixo: cabeçalho, progresso e grupos de perguntas. */
export function DiagnosticAxis({
  catalog,
  step,
  values,
  visible,
  responses,
  items,
  itemActions,
  progress,
  errors,
  readOnly,
  onChange,
  onGoTo,
}: {
  catalog: DiagnosticCatalog;
  step: DiagnosticStep;
  values: AnswerMap;
  visible: Set<string>;
  responses: Record<string, DiagnosticResponse>;
  items: DiagnosticItem[];
  itemActions: ItemActions;
  progress: LocalStepProgress;
  errors: Record<string, string>;
  readOnly: boolean;
  onChange: (key: string, value: AnswerValue) => void;
  onGoTo: (stepId: string) => void;
}) {
  const sections = catalog.sections.filter((section) => section.step_id === step.id);
  const pillars = new Map(catalog.pillars.map((pillar) => [pillar.id, pillar]));
  const eyebrow = step.kind === "identification" ? "Pré-diagnóstico" : `Eixo ${step.order - 1}`;
  const title = step.kind === "identification" ? step.title : step.short_title;

  /** Campo de uma instância: a chave vira o id (radios/ids únicos por item). */
  function renderField(question: DiagnosticQuestion, key: string, index: number) {
    const instance = key === question.id ? question : { ...question, id: key };
    return (
      <Fragment key={key}>
        {index > 0 && !question.scored ? <hr className="border-border/60" /> : null}
        <DiagnosticQuestionField
          question={instance}
          value={values[key] ?? null}
          response={responses[key]}
          pillar={question.pillar_id ? pillars.get(question.pillar_id) : undefined}
          error={errors[key]}
          readOnly={readOnly}
          showOrigin={step.kind === "identification"}
          onChange={(value) => onChange(key, value)}
        />
      </Fragment>
    );
  }

  function renderSection(section: DiagnosticSection) {
    const questions = catalog.questions.filter((question) => question.section_id === section.id);
    const general = questions.filter((question) => !question.per_item && visible.has(question.id));
    const kinds = [
      ...new Set(questions.map((question) => question.per_item).filter(Boolean)),
    ] as ItemKind[];
    const reference = section.item_reference;
    if (general.length === 0 && kinds.length === 0 && !reference) return null;
    const onlyPerItem = general.length === 0 && !reference;

    return (
      <Card key={section.id} className="rounded-xl">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base">{section.title}</CardTitle>
          {section.description ? (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          ) : onlyPerItem ? (
            <p className="text-sm text-muted-foreground">
              Respondida para cada{" "}
              {kinds
                .map((kind) => catalog.item_kinds.find((meta) => meta.kind === kind)?.label.toLowerCase())
                .join(" e ")}{" "}
              cadastrado.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="pt-5">
          <div className="space-y-6">
            {general.map((question, index) => {
              if (question.type === "item_list") {
                const meta = catalog.item_kinds.find((entry) => entry.kind === question.item_kind);
                if (!meta) return null;
                return (
                  <Fragment key={question.id}>
                    {index > 0 ? <hr className="border-border/60" /> : null}
                    <ItemListField
                      question={question}
                      meta={meta}
                      items={itemsOf(items, meta.kind)}
                      progress={itemActions.progress}
                      error={errors[question.id]}
                      readOnly={readOnly}
                      onAdd={(draft) => itemActions.onAdd(meta.kind, draft)}
                      onUpdate={itemActions.onUpdate}
                      onDelete={itemActions.onDelete}
                    />
                  </Fragment>
                );
              }
              return renderField(question, question.id, index);
            })}

            {reference ? (
              <ItemReferenceBlock
                catalog={catalog}
                reference={reference}
                items={items}
                values={values}
                visible={visible}
                readOnly={readOnly}
                onGoTo={onGoTo}
              />
            ) : null}

            {kinds.map((kind) => (
              <PerItemGroup
                key={kind}
                catalog={catalog}
                section={section}
                kind={kind}
                questions={questions.filter((question) => question.per_item === kind)}
                items={items}
                values={values}
                visible={visible}
                errors={errors}
                titled={onlyPerItem}
                renderField={renderField}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
          <h2 className="text-xl font-semibold">{title}</h2>
          {step.description ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{step.description}</p>
          ) : null}
        </div>
        <ProgressIndicator
          value={progress.percent}
          label="Progresso da etapa"
          detail={progressText(progress)}
        />
        {step.kind === "identification" && !readOnly ? (
          <p className="text-xs text-muted-foreground">
            Campos marcados como <strong>Dado cadastral</strong> vêm do cadastro da empresa. Ajustes
            feitos aqui valem para o diagnóstico e não alteram o cadastro.
          </p>
        ) : null}
      </header>

      {sections.map(renderSection)}
    </div>
  );
}

/** Perguntas por item de uma seção: uma sanfona por produto/resíduo cadastrado. */
function PerItemGroup({
  catalog,
  section,
  kind,
  questions,
  items,
  values,
  visible,
  errors,
  titled,
  renderField,
}: {
  catalog: DiagnosticCatalog;
  section: DiagnosticSection;
  kind: ItemKind;
  questions: DiagnosticQuestion[];
  items: DiagnosticItem[];
  values: AnswerMap;
  visible: Set<string>;
  errors: Record<string, string>;
  /** Seção inteira por item: o título da sanfona repete o nome da seção. */
  titled: boolean;
  renderField: (question: DiagnosticQuestion, key: string, index: number) => ReactNode;
}) {
  const meta = catalog.item_kinds.find((entry) => entry.kind === kind);
  const listQuestion = catalog.questions.find((question) => question.id === meta?.list_question_id);
  const kindItems = itemsOf(items, kind);

  if (kindItems.length === 0) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Cadastre {meta?.plural.toLowerCase() ?? "itens"}
        {listQuestion?.code ? ` na pergunta ${listQuestion.code}` : ""} para responder estas
        perguntas — cada {meta?.label.toLowerCase() ?? "item"} terá seu próprio bloco.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!titled ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Respostas por {meta?.label.toLowerCase()}
        </p>
      ) : null}
      {kindItems.map((item) => {
        const instances: QuestionInstance[] = questions.map((question) => ({
          question,
          itemId: item.id,
          key: responseKey(question.id, item.id),
        }));
        const shown = instances.filter((instance) => visible.has(instance.key));
        const progress = instancesProgress(instances, values, items, visible);
        return (
          <ItemAccordion
            key={item.id}
            eyebrow={meta?.label}
            title={titled ? `${section.title} — ${item.name}` : item.name}
            progress={progress}
            defaultOpen={kindItems.length === 1}
            forceOpen={instances.some((instance) => !!errors[instance.key])}
          >
            <div className="space-y-6">
              {shown.map((instance, index) => renderField(instance.question, instance.key, index))}
            </div>
          </ItemAccordion>
        );
      })}
    </div>
  );
}

/** Reflexo somente leitura, por item, de respostas de outra etapa (ex.: 1.8 no Eixo 3). */
function ItemReferenceBlock({
  catalog,
  reference,
  items,
  values,
  visible,
  readOnly,
  onGoTo,
}: {
  catalog: DiagnosticCatalog;
  reference: DiagnosticItemReference;
  items: DiagnosticItem[];
  values: AnswerMap;
  visible: Set<string>;
  readOnly: boolean;
  onGoTo: (stepId: string) => void;
}) {
  const meta = catalog.item_kinds.find((entry) => entry.kind === reference.kind);
  const questions = reference.question_ids
    .map((id) => catalog.questions.find((question) => question.id === id))
    .filter((question): question is DiagnosticQuestion => !!question);
  const kindItems = itemsOf(items, reference.kind);
  const sourceStep = questions[0]?.step_id;

  function body(item: DiagnosticItem) {
    return (
      <dl className="space-y-3">
        {questions.map((question) => {
          const key = responseKey(question.id, item.id);
          const value = values[key] ?? null;
          const answered = visible.has(key) && isAnswered(value);
          return (
            <div key={key} className="space-y-1">
              <dt className="text-xs text-muted-foreground">{questionLabel(question)}</dt>
              <dd
                className={
                  answered
                    ? "rounded-md bg-muted/40 px-3 py-2 text-sm font-medium"
                    : "rounded-md border border-dashed border-amber-500/40 px-3 py-2 text-sm text-amber-700"
                }
              >
                {answered ? displayAnswer(question, value) : "Ainda não respondida no Eixo 1"}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{reference.title}</p>
          {reference.description ? (
            <p className="text-xs text-muted-foreground">{reference.description}</p>
          ) : null}
        </div>
        {!readOnly && sourceStep ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onGoTo(sourceStep)}>
            Alterar no Eixo 1
            <ArrowUpRight aria-hidden />
          </Button>
        ) : null}
      </div>
      {kindItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum {meta?.label.toLowerCase() ?? "item"} cadastrado no Eixo 1.
        </p>
      ) : kindItems.length === 1 ? (
        <div className="rounded-lg border bg-background p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {meta?.label} · {kindItems[0]!.name}
          </p>
          {body(kindItems[0]!)}
        </div>
      ) : (
        <div className="space-y-2">
          {kindItems.map((item) => {
            const missing = questions.filter(
              (question) => !isAnswered(values[responseKey(question.id, item.id)] ?? null),
            ).length;
            return (
              <ItemAccordion
                key={item.id}
                eyebrow={meta?.label}
                title={item.name}
                progress={{
                  requiredTotal: questions.length,
                  requiredAnswered: questions.length - missing,
                  optionalTotal: 0,
                  optionalAnswered: 0,
                  notApplicable: 0,
                  percent: 0,
                  missing: [],
                }}
              >
                {body(item)}
              </ItemAccordion>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MaintenanceStep({ step }: { step: DiagnosticStep }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Eixo {step.order - 1}
        </p>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Lock className="size-4 text-muted-foreground" aria-hidden />
          {step.short_title}
        </h2>
      </header>
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-6 py-14 text-center"
        role="status"
      >
        <Wrench className="mb-4 size-10 text-amber-600" aria-hidden />
        <h3 className="text-lg font-semibold">Em manutenção</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {step.maintenance_message ??
            "Este eixo estará disponível em uma próxima atualização do Diagnóstico de Maturidade Circular."}
        </p>
      </div>
    </div>
  );
}
