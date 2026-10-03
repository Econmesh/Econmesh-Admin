"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { cn } from "@econmesh-admin/ui/lib/utils";
import { Database, Lock, PencilLine, Target } from "lucide-react";

import { displayAnswer, QuestionInput } from "@/modules/diagnostics/components/question-input";
import { questionLabel } from "@/modules/diagnostics/lib/rules";
import type {
  AnswerValue,
  DiagnosticPillar,
  DiagnosticQuestion,
  DiagnosticResponse,
} from "@/services/dmc/diagnostics.service";

type Origin = "registry" | "adjusted" | "diagnostic";

function originOf(
  question: DiagnosticQuestion,
  value: AnswerValue,
  response: DiagnosticResponse | undefined,
): Origin {
  const registry = response?.registry_value;
  if (!question.registry_field || !registry) return "diagnostic";
  const normalize = (text: string) =>
    question.type === "phone" || question.type === "tax_id" ? text.replace(/\D/g, "") : text.trim();
  return typeof value === "string" && normalize(value) === normalize(registry)
    ? "registry"
    : "adjusted";
}

function OriginBadge({ origin }: { origin: Origin }) {
  if (origin === "registry") {
    return (
      <Badge variant="info" className="gap-1">
        <Database className="size-3" aria-hidden />
        Dado cadastral
      </Badge>
    );
  }
  if (origin === "adjusted") {
    return (
      <Badge variant="warning" className="gap-1">
        <PencilLine className="size-3" aria-hidden />
        Ajustado no diagnóstico
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <PencilLine className="size-3" aria-hidden />
      Informação do diagnóstico
    </Badge>
  );
}

export function DiagnosticQuestionField({
  question,
  value,
  response,
  pillar,
  error,
  readOnly,
  showOrigin,
  onChange,
}: {
  question: DiagnosticQuestion;
  value: AnswerValue;
  response?: DiagnosticResponse;
  pillar?: DiagnosticPillar;
  error?: string;
  readOnly?: boolean;
  showOrigin?: boolean;
  onChange: (value: AnswerValue) => void;
}) {
  const id = `question-${question.id}`;
  const helpId = question.help_text || question.objective ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const locked = readOnly || question.read_only;
  const origin = originOf(question, value, response);

  return (
    <div
      id={`${id}-field`}
      className={cn(
        "space-y-2.5 rounded-lg p-1 scroll-mt-24",
        question.scored && "rounded-xl border border-primary/20 bg-primary/[0.03] p-4",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <label
          id={`${id}-label`}
          htmlFor={
            question.type === "single_choice" || question.type === "multi_choice" ? undefined : id
          }
          className="text-sm font-medium leading-snug"
        >
          {questionLabel(question)}
          {question.required && !question.read_only ? (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          ) : null}
          {question.required && !question.read_only ? (
            <span className="sr-only"> (campo obrigatório)</span>
          ) : null}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {question.scored ? (
            <Badge variant="default" className="gap-1">
              <Target className="size-3" aria-hidden />
              Indicador de avaliação
            </Badge>
          ) : null}
          {question.scored && pillar ? (
            <Badge variant="secondary" title={pillar.name}>
              {pillar.code} · {question.pillar_weight}% do pilar · {question.ems_weight}% do EMS
            </Badge>
          ) : null}
          {showOrigin && question.registry_field ? <OriginBadge origin={origin} /> : null}
        </div>
      </div>

      {helpId ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {question.help_text ?? question.objective}
        </p>
      ) : null}

      {question.read_only ? (
        <div
          id={id}
          className="flex min-h-9 items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 text-sm"
          aria-describedby={describedBy}
        >
          <Lock className="size-3.5 text-muted-foreground" aria-hidden />
          <span>{displayAnswer(question, value)}</span>
          <span className="sr-only">(dado cadastral, não editável)</span>
        </div>
      ) : locked ? (
        <p id={id} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
          {displayAnswer(question, value)}
        </p>
      ) : (
        <QuestionInput
          question={question}
          value={value}
          invalid={!!error}
          describedBy={describedBy}
          onChange={onChange}
        />
      )}

      {showOrigin && origin === "adjusted" && response?.registry_value ? (
        <p className="text-xs text-muted-foreground">
          No cadastro: {response.registry_value}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
