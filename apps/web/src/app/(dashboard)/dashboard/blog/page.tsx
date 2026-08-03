"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BlogPostFilters } from "@/modules/blog/components/blog-post-filters";
import { BlogPostList } from "@/modules/blog/components/blog-post-list";
import { useDebouncedValue } from "@/modules/opportunities/hooks/use-debounced-value";
import { adminBlogService } from "@/services/admin/blog.service";
import type { BlogPostListItem, BlogPostListParams } from "@/types/api";
import { ApiError } from "@/utils/errors";

const DEFAULT_FILTERS: BlogPostListParams = {
  sort: "created_at_desc",
  page_size: 10,
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<BlogPostListParams>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(search, 300);

  const pageSize = filters.page_size ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const queryParams = useMemo(
    () => ({
      ...filters,
      page,
      page_size: pageSize,
      q: debouncedSearch.trim() || undefined,
    }),
    [filters, page, pageSize, debouncedSearch],
  );

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBlogService.list(queryParams);
      setPosts(data.items);
      setTotal(data.total);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar os posts.",
      );
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.sort]);

  async function runAction(
    id: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setActionLoadingId(id);
    try {
      await action();
      toast.success(successMessage);
      await loadPosts();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível concluir a ação.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de conteúdo e publicações.
          </p>
        </div>
        <Link href={"/dashboard/blog/novo" as Route} className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Novo post
          </Button>
        </Link>
      </div>

      <BlogPostFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <BlogPostList
          posts={posts}
          actionLoadingId={actionLoadingId}
          onPublish={(id) =>
            void runAction(
              id,
              () => adminBlogService.publish(id),
              "Post publicado.",
            )
          }
          onDisable={(id) =>
            void runAction(
              id,
              () => adminBlogService.disable(id),
              "Post desativado.",
            )
          }
          onDelete={(id) => {
            if (
              !window.confirm(
                "Excluir este post permanentemente? Esta ação não pode ser desfeita.",
              )
            ) {
              return;
            }
            void runAction(
              id,
              () => adminBlogService.delete(id),
              "Post excluído.",
            );
          }}
        />
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {total} post{total === 1 ? "" : "s"} · página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
