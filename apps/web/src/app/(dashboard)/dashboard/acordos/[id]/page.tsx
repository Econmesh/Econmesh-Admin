"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Download } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	AGREEMENT_STATUS_LABELS,
	formatAgreementDate,
} from "@/modules/acordos/constants";
import { adminAgreementsService } from "@/services/admin/agreements.service";
import { ApiError } from "@/utils/errors";
import type { Agreement, AgreementProgress, TimelineEvent } from "@/types/api";

export default function AdminAcordoDetailPage() {
	const params = useParams<{ id: string }>();
	const [agreement, setAgreement] = useState<Agreement | null>(null);
	const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
	const [progress, setProgress] = useState<AgreementProgress | null>(null);

	useEffect(() => {
		void Promise.all([
			adminAgreementsService.get(params.id),
			adminAgreementsService.timeline(params.id),
			adminAgreementsService.progress(params.id),
		])
			.then(([doc, tl, prog]) => {
				setAgreement(doc);
				setTimeline(tl.items);
				setProgress(prog);
			})
			.catch((err) => {
				toast.error(
					err instanceof ApiError ? err.message : "Acordo não encontrado.",
				);
			});
	}, [params.id]);

	async function download(artifact: string) {
		// #region agent log
		fetch("http://127.0.0.1:7321/ingest/0dffd4af-9c1a-46eb-ae81-2c1a98eb0dd9", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Debug-Session-Id": "c6c0dd",
			},
			body: JSON.stringify({
				sessionId: "c6c0dd",
				runId: "post-fix",
				hypothesisId: "A",
				location: "admin/acordos/[id]/page.tsx:download",
				message: "admin download clicked",
				data: {
					agreementId: params.id,
					artifact,
					status: agreement?.status ?? null,
					hasChatAudit: Boolean(agreement?.chat_audit_report_file),
					hasOpportunityAudit: Boolean(agreement?.opportunity_audit_report_file),
					hasChatAuditUrl: Boolean(agreement?.chat_audit_report_file?.url),
					hasOpportunityAuditUrl: Boolean(
						agreement?.opportunity_audit_report_file?.url,
					),
				},
				timestamp: Date.now(),
			}),
		}).catch(() => {});
		// #endregion
		try {
			const res = await adminAgreementsService.download(params.id, artifact);
			// #region agent log
			let urlHost: string | null = null;
			try {
				urlHost = res.url ? new URL(res.url).host : null;
			} catch {
				urlHost = "invalid";
			}
			fetch("http://127.0.0.1:7321/ingest/0dffd4af-9c1a-46eb-ae81-2c1a98eb0dd9", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "c6c0dd",
				},
				body: JSON.stringify({
					sessionId: "c6c0dd",
					runId: "post-fix",
					hypothesisId: "C",
					location: "admin/acordos/[id]/page.tsx:download-ok",
					message: "admin download url received",
					data: {
						artifact,
						hasUrl: Boolean(res?.url),
						urlHost,
						urlPrefix: res?.url ? res.url.slice(0, 80) : null,
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			window.open(res.url, "_blank", "noopener,noreferrer");
		} catch (err) {
			// #region agent log
			fetch("http://127.0.0.1:7321/ingest/0dffd4af-9c1a-46eb-ae81-2c1a98eb0dd9", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "c6c0dd",
				},
				body: JSON.stringify({
					sessionId: "c6c0dd",
					runId: "post-fix",
					hypothesisId: "A",
					location: "admin/acordos/[id]/page.tsx:download-err",
					message: "admin download failed",
					data: {
						artifact,
						errorMessage: err instanceof ApiError ? err.message : String(err),
						errorStatus: err instanceof ApiError ? err.status : null,
						errorCode: err instanceof ApiError ? err.code : null,
						errorDetails: err instanceof ApiError ? err.details : null,
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			toast.error(
				err instanceof ApiError ? err.message : "Download indisponível.",
			);
		}
	}

	if (!agreement) {
		return <p className="text-sm text-muted-foreground">Carregando…</p>;
	}

	return (
		<div className="space-y-6">
			<div>
				<Link
					href={"/dashboard/acordos" as Route}
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Acordos
				</Link>
				<h1 className="mt-2 text-2xl font-semibold">{agreement.title}</h1>
				<p className="text-sm text-muted-foreground">
					{agreement.company_name} · {AGREEMENT_STATUS_LABELS[agreement.status]}{" "}
					· {agreement.verification_code}
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<section className="rounded-xl border p-4">
					<h2 className="mb-3 font-semibold">Participantes</h2>
					<ul className="space-y-2 text-sm">
						{agreement.participants.map((p) => (
							<li key={p.id} className="rounded-lg border p-3">
								<p className="font-medium">{p.name}</p>
								<p className="text-xs text-muted-foreground">
									{p.role} · {p.email} · {p.status}
								</p>
							</li>
						))}
					</ul>
				</section>

				<section className="rounded-xl border p-4">
					<h2 className="mb-3 font-semibold">Progresso</h2>
					{progress ? (
						<ul className="space-y-1 text-sm text-muted-foreground">
							<li>Total: {progress.total_participants}</li>
							<li>Concluídos: {progress.completed}</li>
							<li>Pendentes: {progress.pending}</li>
							<li>Rejeitados: {progress.rejected}</li>
							<li>Percentual: {progress.progress_percent}%</li>
						</ul>
					) : null}
					<div className="mt-4 space-y-2">
						{(
							[
								["signed", "PDF final"],
								["audit", "Auditoria do acordo"],
								["certificate", "Certificado"],
								["original", "Original"],
								...(progress?.progress_percent === 100 ||
								agreement.status === "signed"
									? [
											["chat_audit", "Auditoria do chat"],
											[
												"opportunity_audit",
												"Auditoria da oportunidade",
											],
										]
									: []),
							] as Array<[string, string]>
						).map(([artifact, label]) => (
							<Button
								key={artifact}
								type="button"
								variant="outline"
								size="sm"
								className="w-full justify-start"
								onClick={() => void download(artifact)}
							>
								<Download className="size-4" />
								{label}
							</Button>
						))}
					</div>
				</section>
			</div>

			<section className="rounded-xl border p-4">
				<h2 className="mb-3 font-semibold">Timeline</h2>
				<ol className="space-y-3">
					{timeline.map((event) => (
						<li key={event.id} className="border-l-2 border-primary/30 pl-4">
							<p className="text-sm font-medium">{event.event_type}</p>
							<p className="text-xs text-muted-foreground">
								{formatAgreementDate(event.created_at)}
								{event.actor_name ? ` · ${event.actor_name}` : ""}
								{event.actor_company_name
									? ` · ${event.actor_company_name}`
									: ""}
							</p>
						</li>
					))}
				</ol>
			</section>
		</div>
	);
}
