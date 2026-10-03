"use client";

import { Input } from "@econmesh-admin/ui/components/input";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { cn } from "@econmesh-admin/ui/lib/utils";
import { Check } from "lucide-react";

import type { AnswerValue, DiagnosticQuestion } from "@/services/dmc/diagnostics.service";
import { formatCnpj } from "@/modules/diagnostics/lib/rules";

type Props = {
  question: DiagnosticQuestion;
  value: AnswerValue;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: AnswerValue) => void;
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

/** Campo de entrada conforme o tipo definido no catálogo. */
export function QuestionInput({ question, value, disabled, invalid, describedBy, onChange }: Props) {
  const id = `question-${question.id}`;

  if (question.type === "single_choice") {
    return (
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-required={question.required || undefined}
        aria-invalid={invalid || undefined}
        className="grid gap-2 sm:grid-cols-2"
      >
        {question.options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="size-4 accent-primary"
              />
              <span className="flex-1">{option.label}</span>
              {question.scored && option.points != null ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {option.points} pts
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === "multi_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        className="grid gap-2 sm:grid-cols-2"
      >
        {question.options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  const next = checked
                    ? selected.filter((item) => item !== option.value)
                    : [...selected, option.value];
                  onChange(next.length > 0 ? next : null);
                }}
                className="size-4 accent-primary"
              />
              <span className="flex-1">{option.label}</span>
              {checked ? <Check className="size-4 text-primary" aria-hidden /> : null}
            </label>
          );
        })}
      </div>
    );
  }

  const text = typeof value === "string" ? value : "";
  const common = {
    id,
    disabled,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    "aria-required": question.required || undefined,
    maxLength: question.max_length,
    placeholder: question.placeholder ?? undefined,
  };

  if (question.type === "long_text") {
    return (
      <Textarea
        {...common}
        rows={4}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 text-sm md:text-sm"
      />
    );
  }

  if (question.type === "tax_id") {
    return (
      <Input
        {...common}
        inputMode="numeric"
        value={formatCnpj(text)}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      />
    );
  }

  if (question.type === "phone") {
    return (
      <Input
        {...common}
        type="tel"
        inputMode="tel"
        value={formatPhone(text)}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      />
    );
  }

  return (
    <Input
      {...common}
      type={question.type === "email" ? "email" : "text"}
      value={text}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** Valor legível de uma resposta (somente leitura / revisão). */
export function displayAnswer(question: DiagnosticQuestion, value: AnswerValue): string {
  if (value == null || (Array.isArray(value) && value.length === 0)) return "—";
  if (Array.isArray(value)) {
    return value
      .map((item) => question.options.find((option) => option.value === item)?.label ?? item)
      .join(", ");
  }
  if (question.options.length > 0) {
    return question.options.find((option) => option.value === value)?.label ?? value;
  }
  if (question.type === "tax_id") return formatCnpj(value);
  if (question.type === "phone") return formatPhone(value);
  return value || "—";
}
