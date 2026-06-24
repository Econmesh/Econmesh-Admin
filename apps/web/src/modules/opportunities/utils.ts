import type { Opportunity } from "@/types/api";

export function getPrimaryImage(opportunity: Opportunity): string | null {
	const primary = opportunity.images.find((img) => img.is_primary);
	if (primary) return primary.url;
	return opportunity.images[0]?.url ?? null;
}
