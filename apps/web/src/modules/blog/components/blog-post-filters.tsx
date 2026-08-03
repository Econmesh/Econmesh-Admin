"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { Select } from "@econmesh-admin/ui/components/select";
import { X } from "lucide-react";

import { BLOG_STATUS_OPTIONS } from "@/modules/blog/schemas";
import type { BlogPostListParams, BlogPostSort, BlogPostStatus } from "@/types/api";

type BlogPostFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: BlogPostListParams;
  onChange: (filters: BlogPostListParams) => void;
  onClear: () => void;
};

const SORT_OPTIONS: { value: BlogPostSort; label: string }[] = [
  { value: "created_at_desc", label: "Criação (mais recentes)" },
  { value: "created_at_asc", label: "Criação (mais antigos)" },
  { value: "publish_at_desc", label: "Publicação (mais recentes)" },
  { value: "publish_at_asc", label: "Publicação (mais antigos)" },
];

export function BlogPostFilters({
  search,
  onSearchChange,
  filters,
  onChange,
  onClear,
}: BlogPostFiltersProps) {
  const hasActive = Boolean(filters.status || search.trim());

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="blog-search">Buscar por título</Label>
        <Input
          id="blog-search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Digite para buscar…"
        />
      </div>
      <div className="w-full space-y-2 md:w-48">
        <Label htmlFor="blog-status">Status</Label>
        <Select
          id="blog-status"
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              status: (e.target.value || undefined) as BlogPostStatus | undefined,
            })
          }
        >
          <option value="">Todos</option>
          {BLOG_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-full space-y-2 md:w-56">
        <Label htmlFor="blog-sort">Ordenação</Label>
        <Select
          id="blog-sort"
          value={filters.sort ?? "created_at_desc"}
          onChange={(e) =>
            onChange({
              ...filters,
              sort: e.target.value as BlogPostSort,
            })
          }
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
      {hasActive ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onSearchChange("");
            onClear();
          }}
        >
          <X className="size-4" aria-hidden />
          Limpar
        </Button>
      ) : null}
    </div>
  );
}
