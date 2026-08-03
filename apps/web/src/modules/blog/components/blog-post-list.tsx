"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import {
  Ban,
  FileText,
  Loader2,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { BLOG_STATUS_LABELS } from "@/modules/blog/schemas";
import type { BlogPostListItem, BlogPostStatus } from "@/types/api";

type BlogPostListProps = {
  posts: BlogPostListItem[];
  loading?: boolean;
  actionLoadingId?: string | null;
  onPublish: (id: string) => void;
  onDisable: (id: string) => void;
  onDelete: (id: string) => void;
};

function statusVariant(
  status: BlogPostStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "published") return "default";
  if (status === "disabled") return "destructive";
  if (status === "scheduled") return "outline";
  return "secondary";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function BlogPostList({
  posts,
  loading,
  actionLoadingId,
  onPublish,
  onDisable,
  onDelete,
}: BlogPostListProps) {
  if (!loading && posts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum post encontrado"
        description="Crie o primeiro artigo do blog."
        action={
          <Link href={"/dashboard/blog/novo" as Route} className="inline-flex">
            <Button>Novo post</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Título</th>
            <th className="px-4 py-3 font-medium">Autor</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Publicação</th>
            <th className="px-4 py-3 font-medium">Criação</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const busy = actionLoadingId === post.id;
            return (
              <tr
                key={post.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{post.title}</div>
                  <div className="text-xs text-muted-foreground">/{post.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {post.author ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(post.status)}>
                    {BLOG_STATUS_LABELS[post.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(post.published_at ?? post.publish_at)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(post.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link href={`/dashboard/blog/${post.id}/editar` as Route}>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Editar"
                        title="Editar"
                        disabled={busy}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </Link>
                    {post.status !== "published" ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Publicar"
                        title="Publicar"
                        disabled={busy}
                        onClick={() => onPublish(post.id)}
                      >
                        {busy ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                      </Button>
                    ) : null}
                    {post.status !== "disabled" ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Desativar"
                        title="Desativar"
                        disabled={busy}
                        onClick={() => onDisable(post.id)}
                      >
                        <Ban className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Excluir"
                      title="Excluir"
                      disabled={busy}
                      onClick={() => onDelete(post.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
