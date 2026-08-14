"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Input } from "@econmesh-admin/ui/components/input";
import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	AGREEMENT_STATUS_LABELS,
	formatAgreementDate,
} from "@/modules/acordos/constants";
import { adminAgreementsService } from "@/services/admin/agreements.service";
import { ApiError } from "@/utils/errors";
import type { AgreementListItem } from "@/types/api";

export default function AdminAcordosPage() {
	const [items, setItems] = useState<AgreementListItem[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		const t = window.setTimeout(() => {
			setLoading(true);
			void adminAgreementsService
				.list({ q: search || undefined, sort: "newest", page: 1, page_size: 50 })
				.then((res) => {
					setItems(res.items);
					setTotal(res.total);
				})
				.catch((err) => {
					toast.error(
						err instanceof ApiError
							? err.message
							: "Não foi possível carregar acordos.",
					);
				})
				.finally(() => setLoading(false));
		}, 250);
		return () => window.clearTimeout(t);
	}, [search]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Acordos</h1>
				<p className="text-sm text-muted-foreground">
					Visão da plataforma · {total} acordo(s)
				</p>
			</div>

			<div className="relative max-w-md">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder="Buscar por título, empresa ou código…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{loading ? (
				<p className="text-sm text-muted-foreground">Carregando…</p>
			) : items.length === 0 ? (
				<p className="text-sm text-muted-foreground">Nenhum acordo encontrado.</p>
			) : (
				<div className="overflow-hidden rounded-xl border">
					<table className="w-full text-sm">
						<thead className="bg-muted/40 text-left">
							<tr>
								<th className="px-4 py-3 font-medium">Documento</th>
								<th className="px-4 py-3 font-medium">Empresa</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium">Progresso</th>
								<th className="px-4 py-3 font-medium">Atualizado</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item) => (
								<tr key={item.id} className="border-t hover:bg-muted/20">
									<td className="px-4 py-3">
										<Link
											href={`/dashboard/acordos/${item.id}` as Route}
											className="font-medium text-primary hover:underline"
										>
											{item.title}
										</Link>
										<p className="text-xs text-muted-foreground">
											{item.verification_code}
										</p>
									</td>
									<td className="px-4 py-3">{item.company_name}</td>
									<td className="px-4 py-3">
										<Badge variant="secondary">
											{AGREEMENT_STATUS_LABELS[item.status]}
										</Badge>
									</td>
									<td className="px-4 py-3">
										{item.signed_count}/{item.total_participants} (
										{item.progress_percent}%)
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{formatAgreementDate(item.updated_at)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
