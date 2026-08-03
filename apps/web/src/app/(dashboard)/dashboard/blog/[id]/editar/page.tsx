"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BlogPostForm } from "@/modules/blog/components/blog-post-form";
import { adminBlogService } from "@/services/admin/blog.service";
import type { BlogPost } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarBlogPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await adminBlogService.get(params.id);
        if (!cancelled) setPost(data);
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar o post.",
        );
        router.push("/dashboard/blog");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/blog">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Editar post</h1>
          <p className="text-sm text-muted-foreground">
            Atualize o conteúdo e o status de publicação.
          </p>
        </div>
      </div>

      {loading || !post ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      ) : (
        <BlogPostForm
          mode="edit"
          initial={post}
          onSubmit={async (payload) => {
            await adminBlogService.update(post.id, payload);
            toast.success("Post atualizado com sucesso.");
            router.push("/dashboard/blog");
          }}
        />
      )}
    </div>
  );
}
