"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNumber, REPORT_BRAND } from "@/modules/diagnostics/lib/report-brand";
import type { ReportAxis, ReportPillar } from "@/services/dmc/diagnostics.service";

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: `1px solid ${REPORT_BRAND.border}`,
  borderRadius: 4,
  color: REPORT_BRAND.ink,
  fontSize: 12,
};

/**
 * Maturidade por eixo. Radar com 3+ eixos avaliados; com menos, barras.
 * Eixos não avaliados nunca recebem valor (não são plotados).
 */
export function MaturityChart({ axes }: { axes: ReportAxis[] }) {
  const evaluated = axes.filter((axis) => axis.status === "evaluated" && axis.percent != null);
  if (evaluated.length === 0) return null;
  const data = evaluated.map((axis) => ({
    name: axis.short_title,
    value: axis.percent ?? 0,
    detail: `${formatNumber(axis.ems_points)} de ${formatNumber(axis.ems_max)} pts no EMS`,
  }));

  if (evaluated.length < 3) {
    return <HorizontalBars data={data} ariaLabel="Maturidade por eixo" />;
  }
  return (
    <figure className="space-y-2">
      <div className="h-72 w-full sm:h-80" role="img" aria-label={describe(data)}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={REPORT_BRAND.border} />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: REPORT_BRAND.ink, fontSize: 12, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tickCount={5}
              angle={90}
              tick={{ fill: REPORT_BRAND.muted, fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              dataKey="value"
              stroke={REPORT_BRAND.green}
              strokeWidth={2}
              fill={REPORT_BRAND.leaf}
              fillOpacity={0.28}
              dot={{ r: 4, fill: REPORT_BRAND.green, stroke: "#fff", strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, _name, item) => [
                `${formatNumber(Number(value))}% · ${(item.payload as { detail: string }).detail}`,
                "Resultado",
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-center text-xs text-[var(--rb-muted)]">
        Maturidade por eixo (% do máximo ponderado). Eixos não avaliados não são plotados.
      </figcaption>
    </figure>
  );
}

export function PillarChart({ pillars }: { pillars: ReportPillar[] }) {
  if (pillars.length === 0) return null;
  const data = pillars.map((pillar) => ({
    name: pillar.name.split("—").pop()?.trim() || pillar.code,
    value: pillar.percent ?? 0,
    detail: `${formatNumber(pillar.points, 2)} de ${pillar.max_points} pontos`,
  }));
  return <HorizontalBars data={data} ariaLabel="Pontuação por pilar de cálculo" />;
}

function describe(data: { name: string; value: number }[]) {
  return data.map((d) => `${d.name}: ${formatNumber(d.value)}%`).join("; ");
}

function HorizontalBars({
  data,
  ariaLabel,
}: {
  data: { name: string; value: number; detail: string }[];
  ariaLabel: string;
}) {
  return (
    <div
      className="w-full"
      style={{ height: Math.max(120, data.length * 44 + 20) }}
      role="img"
      aria-label={`${ariaLabel}: ${describe(data)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 48, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: REPORT_BRAND.ink, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: REPORT_BRAND.surface }}
            contentStyle={tooltipStyle}
            formatter={(value, _name, item) => [
              `${formatNumber(Number(value))}% · ${(item.payload as { detail: string }).detail}`,
              "Resultado",
            ]}
          />
          <Bar
            dataKey="value"
            barSize={14}
            radius={[0, 4, 4, 0]}
            background={{ fill: REPORT_BRAND.track, radius: 4 }}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={REPORT_BRAND.green} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => `${formatNumber(Number(value))}%`}
              style={{ fill: REPORT_BRAND.ink, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
