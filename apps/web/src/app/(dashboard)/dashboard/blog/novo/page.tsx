"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BlogPostForm } from "@/modules/blog/components/blog-post-form";
import { adminBlogService } from "@/services/admin/blog.service";

export default function NovoBlogPostPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/blog">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Novo post</h1>
          <p className="text-sm text-muted-foreground">
            Crie um artigo para o blog público da Econmesh.
          </p>
        </div>
      </div>

      <BlogPostForm
        mode="create"
        onSubmit={async (payload) => {
          await adminBlogService.create(payload);
          toast.success("Post criado com sucesso.");
          router.push("/dashboard/blog");
        }}
      />
    </div>
  );
}
