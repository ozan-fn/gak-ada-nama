import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "#/lib/auth.functions";
import { prisma } from "#/lib/prisma";

export type CreateReportInput = {
	title: string;
	description: string;
	category: string;
	urgency?: string;
	locationName: string;
	latitude?: number;
	longitude?: number;
	images?: string[];
	ecolensAnalysis?: {
		category: string;
		urgency: string;
		summary: string;
		suggestedDescription: string;
		confidence?: number;
		visionModel?: string;
	};
};

export const createReportFn = createServerFn({ method: "POST" })
	.validator((data: CreateReportInput) => {
		if (!data.title?.trim()) {
			throw new Error("Judul laporan wajib diisi");
		}
		if (!data.description?.trim()) {
			throw new Error("Deskripsi laporan wajib diisi");
		}
		if (!data.category?.trim()) {
			throw new Error("Kategori laporan wajib diisi");
		}
		if (!data.locationName?.trim()) {
			throw new Error("Lokasi kejadian wajib diisi");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const session = await ensureSession();

		const report = await prisma.report.create({
			data: {
				title: data.title.trim(),
				description: data.description.trim(),
				category: data.category.trim(),
				urgency: data.urgency?.trim() || "Sedang",
				locationName: data.locationName.trim(),
				latitude: data.latitude,
				longitude: data.longitude,
				images: data.images ?? [],
				userId: session.user.id,
				...(data.ecolensAnalysis
					? {
							ecolensAnalysis: {
								create: {
									category: data.ecolensAnalysis.category,
									urgency: data.ecolensAnalysis.urgency,
									summary: data.ecolensAnalysis.summary,
									suggestedDescription:
										data.ecolensAnalysis.suggestedDescription,
									confidence: data.ecolensAnalysis.confidence,
									visionModel: data.ecolensAnalysis.visionModel,
								},
							},
						}
					: {}),
			},
			include: {
				ecolensAnalysis: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
		});

		return report;
	});

export const getMyReportsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await ensureSession();

		const reports = await prisma.report.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: {
				createdAt: "desc",
			},
			include: {
				ecolensAnalysis: true,
			},
		});

		return reports;
	},
);

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
		const whereClause: Record<string, unknown> = {};

		if (data.category && data.category !== "Semua") {
			whereClause.category = data.category;
		}

		if (data.status && data.status !== "Semua") {
			whereClause.status = data.status;
		}

		if (data.query?.trim()) {
			whereClause.OR = [
				{ title: { contains: data.query.trim(), mode: "insensitive" } },
				{ description: { contains: data.query.trim(), mode: "insensitive" } },
				{ locationName: { contains: data.query.trim(), mode: "insensitive" } },
			];
		}

		const reports = await prisma.report.findMany({
			where: whereClause,
			orderBy: {
				createdAt: "desc",
			},
			take: data.limit ?? 50,
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

		return reports;
	});

export const getReportByIdFn = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const report = await prisma.report.findUnique({
			where: { id },
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

		return report;
	});
