"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Save } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AlertList } from "@/modules/diagnostics/components/alert-list";
import { ConfirmDialog } from "@/modules/diagnostics/components/confirm-dialog";
import { ReportActions } from "@/modules/diagnostics/components/report-actions";
import { DiagnosticAxis, MaintenanceStep } from "@/modules/diagnostics/components/diagnostic-axis";
import { ScoreIndicator } from "@/modules/diagnostics/components/diagnostic-summary";
import {
  DiagnosticStepper,
  type StepperItem,
} from "@/modules/diagnostics/components/diagnostic-stepper";
import { ProgressIndicator } from "@/modules/diagnostics/components/progress-indicator";
import { DiagnosticSaveStatus } from "@/modules/diagnostics/components/save-status";
import {
  readPendingAnswers,
  useDiagnosticAutosave,
} from "@/modules/diagnostics/hooks/use-diagnostic-autosave";
import {
  answersHiddenByChange,
  formatCnpj,
  formatDateTime,
  isAnswered,
  overallProgress,
  questionLabel,
  STATUS_LABELS,
  stepProgress,
  visibleQuestionIds,
  type AnswerMap,
} from "@/modules/diagnostics/lib/rules";
import {
  diagnosticsService,
  type AnswerValue,
  type DiagnosticCatalog,
  type DiagnosticDetail,
  type DiagnosticQuestion,
} from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

const REVIEW_STEP = "review";
const REQUIRED_MESSAGE = "Campo obrigatório.";

type PendingConfirmation = {
  questionId: string;
  value: AnswerValue;
  hidden: DiagnosticQuestion[];
};

/**
 * Diagnóstico concluído: etapas que estavam em manutenção na conclusão
 * continuam em manutenção, mesmo que tenham sido ativadas depois.
 */
function catalogAsCompleted(
  catalog: DiagnosticCatalog,
  detail: DiagnosticDetail,
): DiagnosticCatalog {
  const maintenance = new Set(
    detail.evaluation.steps
      .filter((step) => step.status === "maintenance")
      .map((step) => step.step_id),
  );
  return {
    ...catalog,
    steps: catalog.steps.map((step) =>
      maintenance.has(step.id) ? { ...step, availability: "maintenance" } : step,
    ),
  };
}

function focusQuestion(questionId: string) {
  const field = document.getElementById(`question-${questionId}-field`);
  field?.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = field?.querySelector<HTMLElement>("input, textarea, select");
  input?.focus({ preventScroll: true });
}

export function DiagnosticForm({ diagnosticId }: { diagnosticId: string }) {
  const [catalog, setCatalog] = useState<DiagnosticCatalog | null>(null);
  const [detail, setDetail] = useState<DiagnosticDetail | null>(null);
  const [values, setValues] = useState<AnswerMap>({});
  const [activeStep, setActiveStep] = useState<string>("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [completing, setCompleting] = useState(false);

  const canEdit = detail?.can_edit ?? false;
  const handleSaved = useCallback((saved: DiagnosticDetail) => setDetail(saved), []);
  const autosave = useDiagnosticAutosave(diagnosticId, { enabled: canEdit, onSaved: handleSaved });
  const { setLastSavedAt } = autosave;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([diagnosticsService.catalog(), diagnosticsService.get(diagnosticId)])
      .then(([catalogData, detailData]) => {
        if (cancelled) return;
        const serverValues: AnswerMap = Object.fromEntries(
          Object.entries(detailData.responses).map(([id, response]) => [id, response.value]),
        );
        const pending = detailData.can_edit ? readPendingAnswers(diagnosticId) : {};
        setCatalog(
          detailData.can_edit ? catalogData : catalogAsCompleted(catalogData, detailData),
        );
        setDetail(detailData);
        setValues({ ...serverValues, ...pending });
        setLastSavedAt(new Date(detailData.updated_at));
        const firstAvailable = catalogData.steps.find((step) => step.availability === "available");
        setActiveStep(
          detailData.can_edit
            ? (detailData.current_step ?? firstAvailable?.id ?? REVIEW_STEP)
            : REVIEW_STEP,
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError ? error.message : "Não foi possível carregar o diagnóstico.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [diagnosticId, setLastSavedAt]);

  const availableSteps = useMemo(
    () =>
      (catalog?.steps ?? [])
        .filter((step) => step.availability === "available")
        .sort((a, b) => a.order - b.order),
    [catalog],
  );
  const visible = useMemo(
    () => (catalog ? visibleQuestionIds(catalog, values) : new Set<string>()),
    [catalog, values],
  );
  const progressByStep = useMemo(() => {
    if (!catalog) return new Map<string, ReturnType<typeof stepProgress>>();
    return new Map(
      catalog.steps.map((step) => [step.id, stepProgress(catalog, step, values, visible)]),
    );
  }, [catalog, values, visible]);
  const overall = catalog ? overallProgress(catalog, values) : 0;
  const allComplete = availableSteps.every(
    (step) => (progressByStep.get(step.id)?.missing.length ?? 1) === 0,
  );
  const errors = { ...localErrors, ...autosave.fieldErrors };

  const stepperItems: StepperItem[] = useMemo(() => {
    if (!catalog) return [];
    const items: StepperItem[] = [...catalog.steps]
      .sort((a, b) => a.order - b.order)
      .map((step) => {
        const progress = progressByStep.get(step.id);
        let status: StepperItem["status"] = "not_started";
        if (step.availability !== "available") status = "maintenance";
        else if (progress && progress.missing.length === 0) status = "completed";
        else if (
          catalog.questions.some(
            (q) => q.step_id === step.id && !q.read_only && isAnswered(values[q.id]),
          )
        )
          status = "in_progress";
        return {
          id: step.id,
          order: step.order,
          title: step.title,
          shortTitle: step.kind === "identification" ? step.short_title : `Eixo ${step.order - 1}`,
          status,
          percent: progress?.percent,
        };
      });
    items.push({
      id: REVIEW_STEP,
      order: catalog.steps.length + 1,
      title: "Revisão e conclusão",
      shortTitle: "Revisão",
      status:
        detail?.status === "completed" ? "completed" : allComplete ? "in_progress" : "locked",
    });
    return items;
  }, [catalog, progressByStep, values, allComplete, detail?.status]);

  const applyChange = useCallback(
    (changes: Record<string, AnswerValue>) => {
      setValues((prev) => ({ ...prev, ...changes }));
      setLocalErrors((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(changes)) delete next[id];
        return next;
      });
      for (const [questionId, value] of Object.entries(changes)) {
        autosave.queueAnswer(questionId, value);
      }
    },
    [autosave],
  );

  function handleChange(questionId: string, value: AnswerValue) {
    if (!catalog || !canEdit) return;
    const hidden = answersHiddenByChange(catalog, values, questionId, value);
    if (hidden.length > 0) {
      setConfirmation({ questionId, value, hidden });
      return;
    }
    applyChange({ [questionId]: value });
  }

  function goTo(stepId: string) {
    const item = stepperItems.find((entry) => entry.id === stepId);
    if (item?.status === "locked") {
      toast.info("Conclua as etapas disponíveis para revisar e concluir o diagnóstico.");
      return;
    }
    setActiveStep(stepId);
    setLocalErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (canEdit && availableSteps.some((step) => step.id === stepId)) {
      autosave.queueStep(stepId);
    }
  }

  async function handleSaveNow() {
    autosave.queueStep(
      availableSteps.some((step) => step.id === activeStep)
        ? activeStep
        : (detail?.current_step ?? availableSteps[0]?.id ?? ""),
    );
    const ok = await autosave.flush();
    if (ok) toast.success("Progresso salvo");
    else toast.warning("Não foi possível salvar agora. As alterações ficam guardadas neste navegador.");
  }

  async function handleContinue() {
    if (!catalog || !detail) return;
    const progress = progressByStep.get(activeStep);
    if (progress && progress.missing.length > 0) {
      setLocalErrors(Object.fromEntries(progress.missing.map((id) => [id, REQUIRED_MESSAGE])));
      toast.error(
        `Preencha ${progress.missing.length} ${progress.missing.length === 1 ? "pergunta obrigatória" : "perguntas obrigatórias"} para continuar.`,
      );
      focusQuestion(progress.missing[0]!);
      return;
    }
    setAdvancing(true);
    try {
      await autosave.flush();
      const updated = await diagnosticsService.completeStep(detail.id, activeStep);
      setDetail(updated);
      const index = availableSteps.findIndex((step) => step.id === activeStep);
      const next = availableSteps[index + 1]?.id ?? REVIEW_STEP;
      setActiveStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "step_incomplete") {
        const missing = (error.details?.missing as string[] | undefined) ?? [];
        setLocalErrors(Object.fromEntries(missing.map((id) => [id, REQUIRED_MESSAGE])));
        if (missing[0]) focusQuestion(missing[0]);
      }
      toast.error(error instanceof ApiError ? error.message : "Não foi possível avançar.");
    } finally {
      setAdvancing(false);
    }
  }

  function handlePrevious() {
    const index = availableSteps.findIndex((step) => step.id === activeStep);
    if (activeStep === REVIEW_STEP) {
      goTo(availableSteps[availableSteps.length - 1]!.id);
    } else if (index > 0) {
      goTo(availableSteps[index - 1]!.id);
    }
  }

  async function handleComplete() {
    if (!detail) return;
    setCompleting(true);
    try {
      const ok = await autosave.flush();
      if (!ok) throw new Error("Salve as alterações pendentes antes de concluir.");
      const completed = await diagnosticsService.complete(detail.id);
      setDetail(completed);
      toast.success("Diagnóstico concluído.");
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Não foi possível concluir o diagnóstico.",
      );
    } finally {
      setCompleting(false);
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
        <Link href={"/dashboard/diagnosticos" as Route} className="text-sm text-primary hover:underline">
          Voltar para diagnósticos
        </Link>
      </div>
    );
  }

  if (!catalog || !detail || !activeStep) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const step = catalog.steps.find((entry) => entry.id === activeStep);
  const isAvailableStep = step?.availability === "available";
  const stepIndex = availableSteps.findIndex((entry) => entry.id === activeStep);
  const isLastAvailable = stepIndex === availableSteps.length - 1;
  const completed = detail.status === "completed";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <Link href={"/dashboard/diagnosticos" as Route} className="hover:underline">
            Diagnósticos
          </Link>
          {" / "}
          {detail.company.trade_name || detail.company.legal_name}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">Diagnóstico de Maturidade Circular</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Empresa: <span className="font-medium text-foreground">{detail.company.legal_name}</span>
              {" · "}CNPJ {formatCnpj(detail.company.tax_id)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={completed ? "success" : "info"}>{STATUS_LABELS[detail.status]}</Badge>
              {detail.agent_name ? (
                <span className="text-xs text-muted-foreground">
                  Agente responsável: {detail.agent_name}
                </span>
              ) : null}
            </div>
          </div>
          {canEdit ? (
            <DiagnosticSaveStatus state={autosave.state} lastSavedAt={autosave.lastSavedAt} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Concluído em {formatDateTime(detail.completed_at)}
            </p>
          )}
        </div>
        <ProgressIndicator
          value={completed ? detail.progress : overall}
          label="Progresso geral"
          detail="etapas disponíveis"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DiagnosticStepper items={stepperItems} activeId={activeStep} onSelect={goTo} />
        </aside>

        <section aria-live="polite" className="min-w-0 space-y-6">
          {activeStep === REVIEW_STEP ? (
            <ReviewStep
              catalog={catalog}
              detail={detail}
              progressByStep={progressByStep}
              allComplete={allComplete}
              canEdit={canEdit}
              completing={completing}
              onGoTo={goTo}
              onComplete={() => void handleComplete()}
            />
          ) : step && !isAvailableStep ? (
            <MaintenanceStep step={step} />
          ) : step ? (
            <DiagnosticAxis
              catalog={catalog}
              step={step}
              values={values}
              visible={visible}
              responses={detail.responses}
              progress={progressByStep.get(step.id)!}
              errors={errors}
              readOnly={!canEdit}
              onChange={handleChange}
            />
          ) : null}

          {/* Ações */}
          {activeStep !== REVIEW_STEP || canEdit ? (
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between md:sticky md:bottom-0 md:z-10 md:rounded-xl md:border md:bg-background/95 md:px-4 md:py-3 md:backdrop-blur">
              <div>
                {canEdit ? (
                  <Button type="button" variant="outline" size="lg" onClick={() => void handleSaveNow()}>
                    <Save aria-hidden />
                    Salvar progresso
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                {stepIndex > 0 || activeStep === REVIEW_STEP ? (
                  <Button type="button" variant="ghost" size="lg" onClick={handlePrevious}>
                    <ArrowLeft aria-hidden />
                    Anterior
                  </Button>
                ) : null}
                {isAvailableStep && canEdit ? (
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1 sm:flex-none"
                    disabled={advancing}
                    onClick={() => void handleContinue()}
                  >
                    {advancing ? "Validando…" : isLastAvailable ? "Revisar e concluir" : "Continuar"}
                    <ArrowRight aria-hidden />
                  </Button>
                ) : null}
                {isAvailableStep && !canEdit ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() =>
                      goTo(isLastAvailable ? REVIEW_STEP : availableSteps[stepIndex + 1]!.id)
                    }
                  >
                    Próxima
                    <ArrowRight aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={confirmation !== null}
        title="Perguntas deixarão de se aplicar"
        confirmLabel="Apagar respostas"
        cancelLabel="Manter guardadas"
        onCancel={() => {
          if (confirmation) applyChange({ [confirmation.questionId]: confirmation.value });
          setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation) {
            applyChange({
              [confirmation.questionId]: confirmation.value,
              ...Object.fromEntries(confirmation.hidden.map((question) => [question.id, null])),
            });
          }
          setConfirmation(null);
        }}
      >
        <p>Com esta resposta, as perguntas abaixo não se aplicam mais:</p>
        <ul className="list-disc pl-5 text-foreground">
          {confirmation?.hidden.map((question) => (
            <li key={question.id}>{questionLabel(question)}</li>
          ))}
        </ul>
        <p>
          Deseja apagar as respostas já preenchidas? Se mantiver, elas ficam guardadas, mas não são
          consideradas no progresso nem no resultado.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function ReviewStep({
  catalog,
  detail,
  progressByStep,
  allComplete,
  canEdit,
  completing,
  onGoTo,
  onComplete,
}: {
  catalog: DiagnosticCatalog;
  detail: DiagnosticDetail;
  progressByStep: Map<string, ReturnType<typeof stepProgress>>;
  allComplete: boolean;
  canEdit: boolean;
  completing: boolean;
  onGoTo: (stepId: string) => void;
  onComplete: () => void;
}) {
  const completed = detail.status === "completed";
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Revisão</p>
        <h2 className="text-xl font-semibold">
          {completed ? "Diagnóstico concluído" : "Revisão e conclusão"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {completed
            ? `Concluído em ${formatDateTime(detail.completed_at)}. As respostas estão disponíveis para consulta nas etapas.`
            : "Confira o andamento das etapas e os indicadores calculados antes de concluir."}
        </p>
      </header>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Etapas</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {[...catalog.steps]
            .sort((a, b) => a.order - b.order)
            .map((step) => {
              const progress = progressByStep.get(step.id);
              const maintenance = step.availability !== "available";
              const done = !maintenance && progress?.missing.length === 0;
              return (
                <div key={step.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {maintenance
                        ? "Em manutenção — não considerada no progresso"
                        : done
                          ? "Concluída"
                          : `${progress?.missing.length ?? 0} obrigatória(s) pendente(s)`}
                    </p>
                  </div>
                  {maintenance ? (
                    <Badge variant="warning">Em manutenção</Badge>
                  ) : done ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="size-3" aria-hidden />
                      Concluída
                    </Badge>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => onGoTo(step.id)}>
                      Preencher
                    </Button>
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>

      <AlertList alerts={detail.evaluation.alerts ?? []} title="Alertas de risco" />

      <ScoreIndicator catalog={catalog} evaluation={detail.evaluation} />

      {completed ? (
        <ReportActions detail={detail} />
      ) : canEdit ? (
        <Card className="rounded-xl border-primary/30">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {allComplete
                ? "Todas as etapas disponíveis foram preenchidas. Após concluir, as respostas não poderão mais ser editadas."
                : "Preencha todas as perguntas obrigatórias das etapas disponíveis para concluir."}
            </p>
            <Button type="button" size="lg" disabled={!allComplete || completing} onClick={onComplete}>
              <CheckCircle2 aria-hidden />
              {completing ? "Concluindo…" : "Concluir diagnóstico"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
