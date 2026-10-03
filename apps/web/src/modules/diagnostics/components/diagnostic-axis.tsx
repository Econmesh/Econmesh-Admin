"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Lock, Wrench } from "lucide-react";
import { Fragment } from "react";

import { DiagnosticQuestionField } from "@/modules/diagnostics/components/diagnostic-question";
import { ProgressIndicator } from "@/modules/diagnostics/components/progress-indicator";
import type { AnswerMap, LocalStepProgress } from "@/modules/diagnostics/lib/rules";
import type {
  AnswerValue,
  DiagnosticCatalog,
  DiagnosticResponse,
  DiagnosticStep,
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

/** Conteúdo de uma etapa/eixo: cabeçalho, progresso e grupos de perguntas. */
export function DiagnosticAxis({
  catalog,
  step,
  values,
  visible,
  responses,
  progress,
  errors,
  readOnly,
  onChange,
}: {
  catalog: DiagnosticCatalog;
  step: DiagnosticStep;
  values: AnswerMap;
  visible: Set<string>;
  responses: Record<string, DiagnosticResponse>;
  progress: LocalStepProgress;
  errors: Record<string, string>;
  readOnly: boolean;
  onChange: (questionId: string, value: AnswerValue) => void;
}) {
  const sections = catalog.sections.filter((section) => section.step_id === step.id);
  const pillars = new Map(catalog.pillars.map((pillar) => [pillar.id, pillar]));
  const eyebrow = step.kind === "identification" ? "Pré-diagnóstico" : `Eixo ${step.order - 1}`;
  const title = step.kind === "identification" ? step.title : step.short_title;

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

      {sections.map((section) => {
        const questions = catalog.questions.filter(
          (question) => question.section_id === section.id && visible.has(question.id),
        );
        if (questions.length === 0) return null;
        return (
          <Card key={section.id} className="rounded-xl">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">{section.title}</CardTitle>
              {section.description ? (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              ) : null}
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <Fragment key={question.id}>
                    {index > 0 && !question.scored ? <hr className="border-border/60" /> : null}
                    <DiagnosticQuestionField
                      question={question}
                      value={values[question.id] ?? null}
                      response={responses[question.id]}
                      pillar={question.pillar_id ? pillars.get(question.pillar_id) : undefined}
                      error={errors[question.id]}
                      readOnly={readOnly}
                      showOrigin={step.kind === "identification"}
                      onChange={(value) => onChange(question.id, value)}
                    />
                  </Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
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
