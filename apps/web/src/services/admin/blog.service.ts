import type {
  BlogPost,
  BlogPostCreatePayload,
  BlogPostListParams,
  BlogPostListResponse,
  BlogPostUpdatePayload,
  MessageResponse,
  StorageUploadResponse,
} from "@/types/api";
import { api } from "@/services/api/client";

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const adminBlogService = {
  list(params: BlogPostListParams = {}) {
    return api.get<BlogPostListResponse>(
      `/admin/blog/posts${buildQuery(
        params as Record<string, string | number | boolean | undefined>,
      )}`,
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<BlogPost>(`/admin/blog/posts/${id}`, { auth: true });
  },

  create(body: BlogPostCreatePayload) {
    return api.post<BlogPost>("/admin/blog/posts", body, { auth: true });
  },

  update(id: string, body: BlogPostUpdatePayload) {
    return api.patch<BlogPost>(`/admin/blog/posts/${id}`, body, { auth: true });
  },

  delete(id: string) {
    return api.delete<MessageResponse>(`/admin/blog/posts/${id}`, {
      auth: true,
    });
  },

  publish(id: string) {
    return api.post<BlogPost>(
      `/admin/blog/posts/${id}/publish`,
      undefined,
      { auth: true },
    );
  },

  disable(id: string) {
    return api.post<BlogPost>(
      `/admin/blog/posts/${id}/disable`,
      undefined,
      { auth: true },
    );
  },

  async uploadCover(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload<StorageUploadResponse>(
      "/admin/blog/posts/images/upload",
      formData,
      { auth: true },
    );
  },
};
