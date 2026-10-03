import { cn } from "@econmesh-admin/ui/lib/utils";

export function ProgressIndicator({
  value,
  label,
  detail,
  className,
  size = "md",
}: {
  value: number;
  label?: string;
  detail?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("space-y-1.5", className)}>
      {label || detail ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          {label ? <span className="font-medium">{label}</span> : <span />}
          <span className="text-muted-foreground">
            {detail ? `${detail} · ` : ""}
            <span className="font-medium text-foreground">{percent}%</span>
          </span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label ?? "Progresso"}
        className={cn("w-full overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            percent === 100 ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
