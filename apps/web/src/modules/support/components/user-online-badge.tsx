"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";

type Props = {
  online: boolean;
};

export function UserOnlineBadge({ online }: Props) {
  return (
    <Badge variant={online ? "default" : "secondary"} className="gap-1.5">
      <span
        className={`size-2 rounded-full ${online ? "bg-emerald-400" : "bg-muted-foreground/50"}`}
        aria-hidden
      />
      {online ? "Cliente online" : "Cliente offline"}
    </Badge>
  );
}
