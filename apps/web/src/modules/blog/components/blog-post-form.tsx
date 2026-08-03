"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { Select } from "@econmesh-admin/ui/components/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import { BlogCoverUpload } from "@/modules/blog/components/blog-cover-upload";
import { BlogEditor } from "@/modules/blog/components/blog-editor";
import {
  BLOG_STATUS_OPTIONS,
  EMPTY_BLOG_FORM,
  blogPostFormSchema,
  isoToLocalDatetime,
  normalizeBlogPayload,
  type BlogPostFormValues,
} from "@/modules/blog/schemas";
import type {
  BlogCoverImage,
  BlogPost,
  BlogPostCreatePayload,
  BlogPostUpdatePayload,
} from "@/types/api";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";

type BlogPostFormProps =
  | {
      mode: "create";
      onSubmit: (payload: BlogPostCreatePayload) => Promise<void>;
      submitLabel?: string;
    }
  | {
      mode: "edit";
      initial: BlogPost;
      onSubmit: (payload: BlogPostUpdatePayload) => Promise<void>;
      submitLabel?: string;
    };

function postToFormValues(post: BlogPost): BlogPostFormValues {
  return {
    title: post.title,
    content: post.content,
    excerpt: post.excerpt ?? "",
    author: post.author ?? "",
    slug: post.slug ?? "",
    tags: post.tags.join(", "),
    category: post.category ?? "",
    publish_at: isoToLocalDatetime(post.publish_at),
    meta_title: post.meta_title ?? "",
    meta_description: post.meta_description ?? "",
    status: post.status,
  };
}

export function BlogPostForm(props: BlogPostFormProps) {
  const [values, setValues] = useState<BlogPostFormValues>(
    props.mode === "edit" ? postToFormValues(props.initial) : EMPTY_BLOG_FORM,
  );
  const [cover, setCover] = useState<BlogCoverImage | null>(
    props.mode === "edit" ? props.initial.cover_image : null,
  );
  const [clearedCover, setClearedCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const { errors, setErrors } = useFormErrors<keyof BlogPostFormValues | string>();

  function updateField<K extends keyof BlogPostFormValues>(
    key: K,
    value: BlogPostFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const parsed = blogPostFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const base = normalizeBlogPayload(parsed.data, cover);
      if (props.mode === "create") {
        await props.onSubmit(base);
      } else {
        const update: BlogPostUpdatePayload = {
          ...base,
          clear_cover_image: clearedCover && !cover,
          clear_publish_at: !parsed.data.publish_at,
        };
        await props.onSubmit(update);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = getValidationFieldErrors(error.details);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }
        toast.error(error.message);
      } else {
        toast.error("Não foi possível salvar o post.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="title" label="Título *" error={errors.title}>
          <FormInput
            id="title"
            value={values.title}
            onChange={(e) => updateField("title", e.target.value)}
            aria-invalid={Boolean(errors.title)}
            disabled={loading}
          />
        </FormField>
        <FormField id="slug" label="Slug (opcional)" error={errors.slug}>
          <FormInput
            id="slug"
            value={values.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            placeholder="gerado automaticamente do título"
            aria-invalid={Boolean(errors.slug)}
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField id="content" label="Conteúdo *" error={errors.content}>
        <BlogEditor
          value={values.content}
          onChange={(content) => updateField("content", content)}
          disabled={loading}
          error={Boolean(errors.content)}
        />
      </FormField>

      <FormField id="excerpt" label="Resumo" error={errors.excerpt}>
        <Textarea
          id="excerpt"
          value={values.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          rows={3}
          disabled={loading}
          aria-invalid={Boolean(errors.excerpt)}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="author" label="Autor" error={errors.author}>
          <FormInput
            id="author"
            value={values.author}
            onChange={(e) => updateField("author", e.target.value)}
            disabled={loading}
          />
        </FormField>
        <FormField id="category" label="Categoria" error={errors.category}>
          <FormInput
            id="category"
            value={values.category}
            onChange={(e) => updateField("category", e.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField
        id="tags"
        label="Tags (separadas por vírgula)"
        error={errors.tags}
      >
        <FormInput
          id="tags"
          value={values.tags}
          onChange={(e) => updateField("tags", e.target.value)}
          placeholder="circularidade, indústria, sustentabilidade"
          disabled={loading}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="status" label="Status" error={errors.status}>
          <Select
            id="status"
            value={values.status}
            onChange={(e) =>
              updateField(
                "status",
                e.target.value as BlogPostFormValues["status"],
              )
            }
            disabled={loading}
          >
            {BLOG_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          id="publish_at"
          label="Data de publicação"
          error={errors.publish_at}
        >
          <FormInput
            id="publish_at"
            type="datetime-local"
            value={values.publish_at}
            onChange={(e) => updateField("publish_at", e.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          id="meta_title"
          label="Meta title (SEO)"
          error={errors.meta_title}
        >
          <FormInput
            id="meta_title"
            value={values.meta_title}
            onChange={(e) => updateField("meta_title", e.target.value)}
            disabled={loading}
          />
        </FormField>
        <FormField
          id="meta_description"
          label="Meta description (SEO)"
          error={errors.meta_description}
        >
          <FormInput
            id="meta_description"
            value={values.meta_description}
            onChange={(e) => updateField("meta_description", e.target.value)}
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField id="cover" label="Imagem de capa">
        <BlogCoverUpload
          value={cover}
          disabled={loading}
          onChange={(next) => {
            setCover(next);
            setClearedCover(next === null);
          }}
        />
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            (props.submitLabel ??
              (props.mode === "create" ? "Criar post" : "Salvar alterações"))
          )}
        </Button>
      </div>
    </form>
  );
}
