"use client";

import { FileText } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de conteúdo e publicações.
        </p>
      </div>
      <EmptyState
        icon={FileText}
        title="Módulo em desenvolvimento"
        description="A gestão de blog será disponibilizada em breve."
      />
    </div>
  );
}
