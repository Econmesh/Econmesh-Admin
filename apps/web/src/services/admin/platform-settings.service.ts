import { api } from "@/services/api/client";
import type { PlatformSettings } from "@/types/api";

export const adminPlatformSettingsService = {
  get() {
    return api.get<PlatformSettings>("/admin/platform/settings", { auth: true });
  },
  update(body: { require_signature_authorization: boolean }) {
    return api.patch<PlatformSettings>("/admin/platform/settings", body, { auth: true });
  },
};
