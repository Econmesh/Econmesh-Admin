import type { VisualSignature, VisualSignaturesBundle } from "@/types/api";
import { api } from "@/services/api/client";

export const adminVisualSignaturesService = {
  list(userId: string) {
    return api.get<VisualSignaturesBundle>(
      `/admin/users/${userId}/visual-signatures`,
      { auth: true },
    );
  },

  getImage(userId: string, signatureId: string) {
    return api.getArrayBuffer(
      `/admin/users/${userId}/visual-signatures/${signatureId}/image`,
      { auth: true },
    );
  },
};

export type { VisualSignature };
