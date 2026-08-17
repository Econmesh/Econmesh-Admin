import { api } from "@/services/api/client";
import type { ForoFillMode, PlatformSettings } from "@/types/api";

export const adminPlatformSettingsService = {
  get() {
    return api.get<PlatformSettings>("/admin/platform/settings", { auth: true });
  },
  update(body: {
    require_signature_authorization?: boolean;
    foro_fill_mode?: ForoFillMode;
    foro_city?: string | null;
    foro_state?: string | null;
  }) {
    return api.patch<PlatformSettings>("/admin/platform/settings", body, { auth: true });
  },
};
