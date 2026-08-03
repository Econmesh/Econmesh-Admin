"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { adminBlogService } from "@/services/admin/blog.service";
import type { BlogCoverImage } from "@/types/api";
import { ApiError } from "@/utils/errors";

type BlogCoverUploadProps = {
  value: BlogCoverImage | null;
  onChange: (value: BlogCoverImage | null) => void;
  disabled?: boolean;
};

export function BlogCoverUpload({
  value,
  onChange,
  disabled,
}: BlogCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await adminBlogService.uploadCover(file);
      onChange({
        storage_key: uploaded.storage_key,
        public_url: uploaded.public_url,
      });
      toast.success("Imagem de capa enviada.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {value?.public_url ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <Image
            src={value.public_url}
            alt="Capa do post"
            width={800}
            height={400}
            className="h-48 w-full object-cover"
            unoptimized
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              disabled={disabled || uploading}
              onClick={() => onChange(null)}
              aria-label="Remover capa"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
          Nenhuma imagem de capa
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="size-4" aria-hidden />
        )}
        {uploading ? "Enviando…" : "Enviar capa"}
      </Button>
    </div>
  );
}
