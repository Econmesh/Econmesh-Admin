import { api } from "@/services/api/client";
import type {
  AdminPendingUserListResponse,
  AdminSubscriptionListItem,
  AdminSubscriptionListResponse,
  BillingCoupon,
  BillingCouponCreatePayload,
  BillingCouponListResponse,
  BillingInvoiceListResponse,
  BillingPlan,
  BillingPlanCreatePayload,
  BillingPlanListResponse,
  BillingPlanUpdatePayload,
  BillingSettings,
  SubscriptionStatus,
} from "@/types/api";

function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const adminBillingService = {
  listPlans() {
    return api.get<BillingPlanListResponse>("/admin/billing/plans?page=1&page_size=100", {
      auth: true,
    });
  },
  getPlan(id: string) {
    return api.get<BillingPlan>(`/admin/billing/plans/${id}`, { auth: true });
  },
  createPlan(body: BillingPlanCreatePayload) {
    return api.post<BillingPlan>("/admin/billing/plans", body, { auth: true });
  },
  updatePlan(id: string, body: BillingPlanUpdatePayload) {
    return api.patch<BillingPlan>(`/admin/billing/plans/${id}`, body, { auth: true });
  },
  getSettings() {
    return api.get<BillingSettings>("/admin/billing/settings", { auth: true });
  },
  updateSettings(body: Partial<BillingSettings>) {
    return api.patch<BillingSettings>("/admin/billing/settings", body, { auth: true });
  },
  listCoupons() {
    return api.get<BillingCouponListResponse>("/admin/billing/coupons?page=1&page_size=100", {
      auth: true,
    });
  },
  getCoupon(id: string) {
    return api.get<BillingCoupon>(`/admin/billing/coupons/${id}`, { auth: true });
  },
  createCoupon(body: BillingCouponCreatePayload) {
    return api.post<BillingCoupon>("/admin/billing/coupons", body, { auth: true });
  },
  updateCoupon(id: string, body: Partial<BillingCouponCreatePayload> & { is_active?: boolean }) {
    return api.patch<BillingCoupon>(`/admin/billing/coupons/${id}`, body, { auth: true });
  },
  listSubscriptions(params: { status?: SubscriptionStatus; page?: number } = {}) {
    return api.get<AdminSubscriptionListResponse>(
      `/admin/billing/subscriptions${qs({
        status: params.status,
        page: params.page ?? 1,
        page_size: 100,
      })}`,
      { auth: true },
    );
  },
  getSubscription(id: string) {
    return api.get<AdminSubscriptionListItem>(`/admin/billing/subscriptions/${id}`, {
      auth: true,
    });
  },
  listSubscriptionInvoices(id: string) {
    return api.get<BillingInvoiceListResponse>(
      `/admin/billing/subscriptions/${id}/invoices?page=1&page_size=100`,
      { auth: true },
    );
  },
  listPendingUsers() {
    return api.get<AdminPendingUserListResponse>(
      "/admin/billing/subscriptions/pending-users?page=1&page_size=100",
      { auth: true },
    );
  },
};
