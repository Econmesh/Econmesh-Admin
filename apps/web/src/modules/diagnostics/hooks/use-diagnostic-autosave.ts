"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  diagnosticsService,
  type AnswerInput,
  type AnswerValue,
  type DiagnosticDetail,
} from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "offline" | "error";

type PendingAnswer = { value: AnswerValue; edited_at: string };
type PendingStore = { answers: Record<string, PendingAnswer>; step: string | null };

const DEBOUNCE_MS = 800;
const RETRY_MS = 10_000;

function storageKey(diagnosticId: string) {
  return `econmesh:dmc-diagnostic:${diagnosticId}:pending`;
}

function readStore(diagnosticId: string): PendingStore | null {
  try {
    const raw = window.localStorage.getItem(storageKey(diagnosticId));
    return raw ? (JSON.parse(raw) as PendingStore) : null;
  } catch {
    return null;
  }
}

function writeStore(diagnosticId: string, store: PendingStore) {
  try {
    if (Object.keys(store.answers).length === 0 && !store.step) {
      window.localStorage.removeItem(storageKey(diagnosticId));
    } else {
      window.localStorage.setItem(storageKey(diagnosticId), JSON.stringify(store));
    }
  } catch {
    // Armazenamento indisponível (modo privado etc.) — segue só em memória.
  }
}

/** Respostas ainda não enviadas ao servidor (ex.: queda de conexão anterior). */
export function readPendingAnswers(diagnosticId: string): Record<string, AnswerValue> {
  const store = readStore(diagnosticId);
  if (!store) return {};
  return Object.fromEntries(
    Object.entries(store.answers).map(([questionId, entry]) => [questionId, entry.value]),
  );
}

/**
 * Salvamento automático com fila local:
 * - cada alteração entra numa fila (memória + localStorage) e é enviada com debounce;
 * - sem conexão, a fila fica guardada no navegador e é reenviada ao reconectar;
 * - ao voltar à página, alterações não enviadas são restauradas.
 */
export function useDiagnosticAutosave(
  diagnosticId: string,
  { enabled, onSaved }: { enabled: boolean; onSaved: (detail: DiagnosticDetail) => void },
) {
  const pendingRef = useRef<PendingStore>({ answers: {}, step: null });
  const inflightRef = useRef<Promise<boolean> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSavedRef = useRef(onSaved);
  const [state, setState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const hasPending = useCallback(() => {
    const pending = pendingRef.current;
    return Object.keys(pending.answers).length > 0 || pending.step !== null;
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (!enabled) return true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (inflightRef.current) {
      await inflightRef.current;
      if (!hasPending()) return true;
    }
    if (!hasPending()) return true;

    const snapshot: PendingStore = {
      answers: { ...pendingRef.current.answers },
      step: pendingRef.current.step,
    };
    const answers: AnswerInput[] = Object.entries(snapshot.answers).map(
      ([question_id, entry]) => ({ question_id, value: entry.value, edited_at: entry.edited_at }),
    );

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState("offline");
      return false;
    }

    setState("saving");
    const request = (async () => {
      try {
        const detail = await diagnosticsService.saveResponses(diagnosticId, {
          answers,
          current_step: snapshot.step,
        });
        // Remove da fila apenas o que não mudou durante o envio.
        for (const [questionId, entry] of Object.entries(snapshot.answers)) {
          if (pendingRef.current.answers[questionId]?.edited_at === entry.edited_at) {
            delete pendingRef.current.answers[questionId];
          }
        }
        if (pendingRef.current.step === snapshot.step) pendingRef.current.step = null;
        writeStore(diagnosticId, pendingRef.current);
        setFieldErrors({});
        setLastSavedAt(new Date(detail.updated_at));
        setState(hasPending() ? "pending" : "saved");
        onSavedRef.current(detail);
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          const errors = (error.details?.errors ?? {}) as Record<string, string>;
          if (error.code === "validation_error" && errors && !Array.isArray(errors)) {
            // Respostas inválidas não ficam presas na fila.
            for (const questionId of Object.keys(errors)) {
              delete pendingRef.current.answers[questionId];
            }
            writeStore(diagnosticId, pendingRef.current);
            setFieldErrors(errors);
          }
          setState("error");
          return false;
        }
        // Falha de rede/timeout: mantém a fila e tenta de novo.
        setState("offline");
        return false;
      } finally {
        inflightRef.current = null;
      }
    })();
    inflightRef.current = request;
    const ok = await request;
    if (!ok && hasPending()) {
      timerRef.current = setTimeout(() => void flush(), RETRY_MS);
    }
    return ok;
  }, [diagnosticId, enabled, hasPending]);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState("pending");
    timerRef.current = setTimeout(() => void flush(), DEBOUNCE_MS);
  }, [flush]);

  const queueAnswer = useCallback(
    (questionId: string, value: AnswerValue) => {
      pendingRef.current.answers[questionId] = { value, edited_at: new Date().toISOString() };
      writeStore(diagnosticId, pendingRef.current);
      setFieldErrors((prev) => {
        if (!(questionId in prev)) return prev;
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      schedule();
    },
    [diagnosticId, schedule],
  );

  const queueStep = useCallback(
    (stepId: string) => {
      pendingRef.current.step = stepId;
      writeStore(diagnosticId, pendingRef.current);
      schedule();
    },
    [diagnosticId, schedule],
  );

  // Restaura a fila deixada por uma sessão anterior e tenta enviá-la.
  useEffect(() => {
    if (!enabled) return;
    const stored = readStore(diagnosticId);
    if (stored && (Object.keys(stored.answers).length > 0 || stored.step)) {
      pendingRef.current = {
        answers: { ...stored.answers, ...pendingRef.current.answers },
        step: pendingRef.current.step ?? stored.step,
      };
      schedule();
    }
  }, [diagnosticId, enabled, schedule]);

  useEffect(() => {
    if (!enabled) return;
    const onOnline = () => void flush();
    const onHidden = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPending()) return;
      void flush();
      // Os dados já estão no navegador; o aviso evita fechar no meio do envio.
      event.preventDefault();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, flush, hasPending]);

  // Ao sair da tela, envia o que estiver pendente (a fila local cobre falhas).
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void flushRef.current();
    },
    [],
  );

  return { state, lastSavedAt, setLastSavedAt, fieldErrors, queueAnswer, queueStep, flush };
}
