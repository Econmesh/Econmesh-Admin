import { z } from "zod";

import type { BlogPostCreatePayload, BlogPostStatus } from "@/types/api";

export const BLOG_STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  disabled: "Desativado",
};

export const BLOG_STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendado" },
  { value: "published", label: "Publicado" },
  { value: "disabled", label: "Desativado" },
];

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };

function isTipTapDoc(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const doc = value as { type?: string; content?: unknown[] };
  return doc.type === "doc" && Array.isArray(doc.content);
}

function hasVisibleContent(value: unknown): boolean {
  if (!isTipTapDoc(value)) return false;
  const walk = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const n = node as { text?: string; content?: unknown[] };
      if (typeof n.text === "string" && n.text.trim().length > 0) return true;
      if (Array.isArray(n.content) && walk(n.content)) return true;
    }
    return false;
  };
  return walk((value as { content: unknown[] }).content);
}

export const blogPostFormSchema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  content: z.custom<Record<string, unknown>>(
    (val) => hasVisibleContent(val),
    { message: "O conteúdo do post é obrigatório." },
  ),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  author: z.string().trim().max(120).optional().or(z.literal("")),
  slug: z.string().trim().max(120).optional().or(z.literal("")),
  tags: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  publish_at: z.string().optional().or(z.literal("")),
  meta_title: z.string().trim().max(70).optional().or(z.literal("")),
  meta_description: z.string().trim().max(180).optional().or(z.literal("")),
  status: z.enum(["draft", "scheduled", "published", "disabled"]),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

export const EMPTY_BLOG_FORM: BlogPostFormValues = {
  title: "",
  content: emptyDoc,
  excerpt: "",
  author: "",
  slug: "",
  tags: "",
  category: "",
  publish_at: "",
  meta_title: "",
  meta_description: "",
  status: "draft",
};

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseTags(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Convert datetime-local value to ISO string (or null). */
export function localDatetimeToIso(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Convert ISO string to datetime-local input value. */
export function isoToLocalDatetime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function normalizeBlogPayload(
  values: BlogPostFormValues,
  cover?: { storage_key: string; public_url: string } | null,
): BlogPostCreatePayload {
  const publishAt = localDatetimeToIso(values.publish_at);
  return {
    title: values.title.trim(),
    content: values.content,
    excerpt: emptyToNull(values.excerpt),
    author: emptyToNull(values.author),
    slug: emptyToNull(values.slug),
    tags: parseTags(values.tags),
    category: emptyToNull(values.category),
    publish_at: publishAt,
    meta_title: emptyToNull(values.meta_title),
    meta_description: emptyToNull(values.meta_description),
    status: values.status,
    cover_image: cover ?? null,
  };
}
