import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Info } from "lucide-react";

import { ProgressIndicator } from "@/modules/diagnostics/components/progress-indicator";
import type {
  DiagnosticCatalog,
  DiagnosticEvaluation,
} from "@/services/dmc/diagnostics.service";

function formatPoints(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** Pontuação calculada pelo backend: pilares de cálculo e EMS parcial. */
export function ScoreIndicator({
  catalog,
  evaluation,
}: {
  catalog: DiagnosticCatalog;
  evaluation: DiagnosticEvaluation;
}) {
  const pillarNames = new Map(catalog.pillars.map((pillar) => [pillar.id, pillar]));
  const emsPercent =
    evaluation.ems.max_available > 0
      ? (evaluation.ems.points * 100) / evaluation.ems.max_available
      : 0;
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">Indicadores calculados</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pontuação apurada nas perguntas pontuadas dos eixos disponíveis.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {evaluation.pillars.map((pillar) => {
            const meta = pillarNames.get(pillar.pillar_id);
            return (
              <div key={pillar.pillar_id} className="space-y-2 rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground">{meta?.name}</p>
                <p className="text-2xl font-semibold">
                  {pillar.points}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {pillar.max_points} pts
                  </span>
                </p>
                <ProgressIndicator value={pillar.percent ?? 0} size="sm" label={meta?.code} />
                <p className="text-xs text-muted-foreground">
                  {pillar.answered} de {pillar.total} indicadores respondidos
                </p>
              </div>
            );
          })}
        </div>
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">EMS parcial</p>
          <p className="text-2xl font-semibold">
            {formatPoints(evaluation.ems.points)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {formatPoints(evaluation.ems.max_available)} pts possíveis nos eixos disponíveis
            </span>
          </p>
          <ProgressIndicator value={emsPercent} size="sm" />
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Os Eixos 2, 3 e 4 entram no cálculo quando forem disponibilizados. O nível de
            maturidade será apresentado no relatório final.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
