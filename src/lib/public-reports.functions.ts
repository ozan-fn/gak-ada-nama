import type { Prisma } from "@prisma/client";
import { createServerFn } from "@tanstack/react-start";
import { prisma } from "#/lib/prisma";

export const getPublicReportsFn = createServerFn({ method: "GET" })
	.validator(
		(params?: {
			category?: string;
			status?: string;
			query?: string;
			limit?: number;
		}) => params ?? {},
	)
	.handler(async ({ data }) => {
		const where: Prisma.ReportWhereInput = {};

		if (data.category && data.category !== "Semua") {
			where.category = data.category;
		}
		if (data.status && data.status !== "Semua") {
			where.status = data.status;
		}
		if (data.query?.trim()) {
			const query = data.query.trim();
			where.OR = [
				{ title: { contains: query, mode: "insensitive" } },
				{ description: { contains: query, mode: "insensitive" } },
				{ locationName: { contains: query, mode: "insensitive" } },
			];
		}

		return prisma.report.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: Math.min(100, Math.max(1, data.limit ?? 50)),
			include: {
				ecolensAnalysis: true,
				user: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});
	});
