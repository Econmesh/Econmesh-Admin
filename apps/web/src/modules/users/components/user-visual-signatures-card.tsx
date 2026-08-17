"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { adminVisualSignaturesService } from "@/services/admin/visual-signatures.service";
import type { VisualSignature, VisualSignaturesBundle } from "@/types/api";

type UserVisualSignaturesCardProps = {
  userId: string;
};

export function UserVisualSignaturesCard({ userId }: UserVisualSignaturesCardProps) {
  const [bundle, setBundle] = useState<VisualSignaturesBundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    void adminVisualSignaturesService.list(userId).then((data) => {
      if (!cancelled) setBundle(data);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Assinatura visual e rúbrica</CardTitle>
        <CardDescription>Artefatos confirmados e imutáveis do usuário.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <ArtifactBlock
          userId={userId}
          title="Assinatura"
          artifact={bundle?.signature ?? null}
          loaded={bundle !== null}
        />
        <ArtifactBlock
          userId={userId}
          title="Rúbrica"
          artifact={bundle?.initials ?? null}
          loaded={bundle !== null}
        />
      </CardContent>
    </Card>
  );
}

function ArtifactBlock({
  userId,
  title,
  artifact,
  loaded,
}: {
  userId: string;
  title: string;
  artifact: VisualSignature | null;
  loaded: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!artifact) {
      setSrc(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void adminVisualSignaturesService.getImage(userId, artifact.id).then((buffer) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(new Blob([buffer], { type: "image/png" }));
      setSrc(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [artifact, userId]);

  if (!loaded) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">Não cadastrada.</p>
      </div>
    );
  }

  const created = new Date(artifact.created_at);
  const createdLabel = Number.isNaN(created.getTime())
    ? artifact.created_at
    : created.toLocaleString("pt-BR");

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="rounded-md border bg-white p-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={title} src={src} className="mx-auto h-20 w-auto" />
        ) : (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {artifact.source === "automatic" ? "Gerada automaticamente" : "Desenhada"} · {createdLabel}
      </p>
      <p className="break-all font-mono text-[11px] text-muted-foreground">{artifact.sha256}</p>
    </div>
  );
}
