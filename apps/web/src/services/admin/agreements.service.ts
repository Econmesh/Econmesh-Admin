import { api } from "@/services/api/client";
import type {
	Agreement,
	AgreementListParams,
	AgreementListResponse,
	AgreementProgress,
	DownloadUrlResponse,
	TimelineEvent,
} from "@/types/api";

function buildQuery(params: AgreementListParams): string {
	const search = new URLSearchParams();
	search.set("page", String(params.page ?? 1));
	search.set("page_size", String(params.page_size ?? 20));
	if (params.q) search.set("q", params.q);
	if (params.filter) search.set("filter", params.filter);
	if (params.sort) search.set("sort", params.sort);
	if (params.company_id) search.set("company_id", params.company_id);
	return search.toString();
}

export const adminAgreementsService = {
	list(params?: AgreementListParams) {
		const query = buildQuery(params ?? {});
		return api.get<AgreementListResponse>(`/admin/agreements?${query}`, {
			auth: true,
		});
	},

	get(id: string) {
		return api.get<Agreement>(`/admin/agreements/${id}`, { auth: true });
	},

	timeline(id: string) {
		return api.get<{ items: TimelineEvent[] }>(
			`/admin/agreements/${id}/timeline`,
			{ auth: true },
		);
	},

	progress(id: string) {
		return api.get<AgreementProgress>(`/admin/agreements/${id}/progress`, {
			auth: true,
		});
	},

	download(id: string, artifact: string) {
		return api.get<DownloadUrlResponse>(
			`/admin/agreements/${id}/download/${artifact}`,
			{ auth: true },
		);
	},
};
