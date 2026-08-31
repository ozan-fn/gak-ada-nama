import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ensureSession } from "@/lib/auth.functions";
import { getGroqClient } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { deleteObjectByUrl, uploadImageDataUrl } from "@/lib/r2";
import {
	getResolutionBlockCode,
	getResolutionBlockReason,
	hasResolutionQuorum,
	parseResolutionEvidenceAssessment,
	RESOLVABLE_REPORT_STATUSES,
} from "@/lib/report-resolution-policy";
import { haversineDistanceMeters } from "@/lib/report-risk-assessment.server";
import { MAX_ECO_LENS_IMAGE_BYTES } from "@/types/ecolens";
import {
	type AnalyzeResolutionEvidenceInput,
	type AnalyzeResolutionEvidenceResult,
	REPORT_RESOLUTION_MAX_DISTANCE_METERS,
	REPORT_RESOLUTION_REQUIRED_VALIDATIONS,
	type ReportResolutionSummary,
	type SubmitResolutionValidationInput,
	type SubmitResolutionValidationResult,
} from "@/types/report-resolution";

const DEFAULT_VISION_MODEL = "qwen/qwen3.6-27b";
const DATA_URL_PREFIX = "data:image/jpeg;base64,";
const MAX_DATA_URL_LENGTH =
	DATA_URL_PREFIX.length + Math.ceil((MAX_ECO_LENS_IMAGE_BYTES * 4) / 3) + 4;
const EVIDENCE_TOKEN_TTL_MS = 15 * 60 * 1_000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1_000;
const MAX_ANALYSES_PER_WINDOW = 5;

type AnalysisRateLimit = {
	timestamps: number[];
	inFlight: boolean;
};

type EvidenceTokenPayload = {
	version: 1;
	reportId: string;
	userId: string;
	imageHash: string;
	summary: string;
	visionModel: string;
	issuedAt: number;
};

const analysisRateLimits = new Map<string, AnalysisRateLimit>();

function isObjectId(value: string): boolean {
	return /^[a-f\d]{24}$/i.test(value);
}

function getBase64ByteLength(dataUrl: string): number {
	const encoded = dataUrl.slice(DATA_URL_PREFIX.length);
	const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
	return Math.floor((encoded.length * 3) / 4) - padding;
}

function isValidJpegDataUrl(dataUrl: string): boolean {
	if (!dataUrl.startsWith(DATA_URL_PREFIX)) return false;
	if (dataUrl.length > MAX_DATA_URL_LENGTH) return false;

	const encoded = dataUrl.slice(DATA_URL_PREFIX.length);
	return (
		encoded.length % 4 === 0 &&
		encoded.startsWith("/9j/") &&
		/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) &&
		getBase64ByteLength(dataUrl) <= MAX_ECO_LENS_IMAGE_BYTES
	);
}

function boundedText(value: unknown, maxLength: number): string | null {
	if (typeof value !== "string") return null;
	const text = value.replace(/\s+/g, " ").trim();
	return text && text.length <= maxLength ? text : null;
}

function acquireAnalysisSlot(userId: string): boolean {
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_MS;
	const current = analysisRateLimits.get(userId);
	const timestamps =
		current?.timestamps.filter((timestamp) => timestamp >= windowStart) ?? [];
	if (current?.inFlight || timestamps.length >= MAX_ANALYSES_PER_WINDOW) {
		return false;
	}
	analysisRateLimits.set(userId, {
		timestamps: [...timestamps, now],
		inFlight: true,
	});
	return true;
}

function releaseAnalysisSlot(userId: string): void {
	const current = analysisRateLimits.get(userId);
	if (current) analysisRateLimits.set(userId, { ...current, inFlight: false });
}

function evidenceSecret(): string {
	const secret =
		process.env.REPORT_RESOLUTION_TOKEN_SECRET ??
		process.env.BETTER_AUTH_SECRET;
	if (!secret) throw new Error("REPORT_RESOLUTION_TOKEN_SECRET_MISSING");
	return secret;
}

function imageHash(imageDataUrl: string): string {
	return createHash("sha256").update(imageDataUrl).digest("hex");
}

function signEvidenceToken(payload: EvidenceTokenPayload): string {
	const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
	const signature = createHmac("sha256", evidenceSecret())
		.update(encoded)
		.digest("base64url");
	return `${encoded}.${signature}`;
}

function verifyEvidenceToken({
	token,
	reportId,
	userId,
	imageDataUrl,
}: {
	token: string;
	reportId: string;
	userId: string;
	imageDataUrl: string;
}): EvidenceTokenPayload | null {
	const [encoded, signature, extra] = token.split(".");
	if (!encoded || !signature || extra) return null;

	const expected = createHmac("sha256", evidenceSecret())
		.update(encoded)
		.digest();
	let received: Buffer;
	try {
		received = Buffer.from(signature, "base64url");
	} catch {
		return null;
	}
	if (
		expected.length !== received.length ||
		!timingSafeEqual(expected, received)
	) {
		return null;
	}

	let payload: EvidenceTokenPayload;
	try {
		payload = JSON.parse(
			Buffer.from(encoded, "base64url").toString("utf8"),
		) as EvidenceTokenPayload;
	} catch {
		return null;
	}

	if (
		payload.version !== 1 ||
		payload.reportId !== reportId ||
		payload.userId !== userId ||
		payload.imageHash !== imageHash(imageDataUrl) ||
		!Number.isFinite(payload.issuedAt) ||
		Date.now() - payload.issuedAt > EVIDENCE_TOKEN_TTL_MS ||
		payload.issuedAt > Date.now() + 60_000 ||
		!boundedText(payload.summary, 500) ||
		!boundedText(payload.visionModel, 200)
	) {
		return null;
	}
	return payload;
}

async function getEligibilityContext(reportId: string, userId: string) {
	const [report, viewer, existingValidation] = await Promise.all([
		prisma.report.findUnique({
			where: { id: reportId },
			select: {
				id: true,
				userId: true,
				status: true,
				title: true,
				description: true,
				category: true,
				locationName: true,
				latitude: true,
				longitude: true,
				images: true,
			},
		}),
		prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, createdAt: true },
		}),
		prisma.reportResolutionValidation.findUnique({
			where: { reportId_userId: { reportId, userId } },
			select: { id: true },
		}),
	]);
	if (!report) throw new Error("REPORT_NOT_FOUND");
	if (!viewer) throw new Error("UNAUTHORIZED");

	return { report, viewer, existingValidation };
}

function eligibilityError(
	context: Awaited<ReturnType<typeof getEligibilityContext>>,
) {
	const blockCode = getResolutionBlockCode({
		reportStatus: context.report.status,
		reportUserId: context.report.userId,
		reportHasCoordinates:
			typeof context.report.latitude === "number" &&
			typeof context.report.longitude === "number",
		viewerUserId: context.viewer.id,
		viewerCreatedAt: context.viewer.createdAt,
		viewerHasValidated: Boolean(context.existingValidation),
	});
	return blockCode ? getResolutionBlockReason(blockCode) : null;
}

export async function analyzeResolutionEvidence(
	data: AnalyzeResolutionEvidenceInput,
): Promise<AnalyzeResolutionEvidenceResult> {
	const session = await ensureSession();
	if (!isObjectId(data.reportId) || !isValidJpegDataUrl(data.imageDataUrl)) {
		return {
			success: false,
			code: "INVALID_IMAGE",
			message: "Foto bukti tidak valid atau terlalu besar.",
			guidance: "Ambil ulang foto yang jelas menggunakan kamera.",
		};
	}

	const context = await getEligibilityContext(data.reportId, session.user.id);
	const blockedReason = eligibilityError(context);
	if (blockedReason) {
		return { success: false, code: "NOT_ELIGIBLE", message: blockedReason };
	}
	if (!acquireAnalysisSlot(session.user.id)) {
		return {
			success: false,
			code: "RATE_LIMITED",
			message: "Terlalu banyak pemeriksaan bukti. Tunggu beberapa menit.",
		};
	}

	try {
		const groq = getGroqClient();
		const visionModel = process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL;
		const imageContent: Array<
			| { type: "text"; text: string }
			| { type: "image_url"; image_url: { url: string } }
		> = [
			{
				type: "text",
				text: `Periksa FOTO BUKTI BARU untuk laporan berikut. Judul: ${context.report.title}. Kategori: ${context.report.category}. Lokasi: ${context.report.locationName}. Deskripsi awal: ${context.report.description}. Foto pertama (jika ada) adalah bukti awal, foto terakhir adalah bukti baru.`,
			},
		];
		const originalImage = context.report.images[0];
		if (originalImage) {
			imageContent.push({
				type: "image_url",
				image_url: { url: originalImage },
			});
		}
		imageContent.push({
			type: "image_url",
			image_url: { url: data.imageDataUrl },
		});

		const completion = await groq.chat.completions.create({
			model: visionModel,
			messages: [
				{
					role: "system",
					content: `Kamu adalah pemeriksa kualitas bukti EcoLens. Nilai HANYA apakah foto bukti baru cukup jelas, merupakan foto kondisi lapangan (bukan selfie, layar, dokumen, atau gambar tidak terkait), dan relevan dengan konteks kategori/objek laporan. Jangan menentukan apakah masalah sudah benar-benar selesai; keputusan itu milik konsensus pengguna. Tidak terlihatnya masalah lama bukan alasan penolakan. Balas hanya JSON:
{
  "usable": true | false,
  "summary": "Ringkasan faktual foto bukti baru jika layak, atau string kosong",
  "rejectionReason": "Alasan jika tidak layak, atau string kosong",
  "captureGuidance": "Arahan foto ulang spesifik jika tidak layak, atau string kosong"
}`,
				},
				{ role: "user", content: imageContent },
			],
			response_format: { type: "json_object" },
			reasoning_format: "hidden",
			reasoning_effort: "none",
			temperature: 0.1,
			max_completion_tokens: 700,
		});
		const rawText = completion.choices[0]?.message?.content;
		const assessment = rawText
			? parseResolutionEvidenceAssessment(rawText)
			: null;
		if (!assessment) {
			return {
				success: false,
				code: "INVALID_RESPONSE",
				message: "Hasil pemeriksaan EcoLens belum dapat dibaca.",
				guidance: "Coba periksa foto kembali beberapa saat lagi.",
			};
		}
		if (!assessment.usable) {
			return {
				success: false,
				code: "UNSUITABLE_EVIDENCE",
				message: assessment.rejectionReason,
				guidance: assessment.captureGuidance,
			};
		}

		const evidenceToken = signEvidenceToken({
			version: 1,
			reportId: context.report.id,
			userId: session.user.id,
			imageHash: imageHash(data.imageDataUrl),
			summary: assessment.summary,
			visionModel,
			issuedAt: Date.now(),
		});
		return {
			success: true,
			evidenceToken,
			summary: assessment.summary,
			visionModel,
		};
	} catch (error) {
		console.error("[ReportResolution] EcoLens analysis failed", error);
		return {
			success: false,
			code: "AI_UNAVAILABLE",
			message: "EcoLens belum dapat memeriksa bukti saat ini.",
			guidance: "Coba lagi beberapa saat lagi.",
		};
	} finally {
		releaseAnalysisSlot(session.user.id);
	}
}

async function finalizeResolution(reportId: string) {
	const validCount = await prisma.reportResolutionValidation.count({
		where: { reportId },
	});
	if (hasResolutionQuorum(validCount)) {
		await prisma.report.updateMany({
			where: {
				id: reportId,
				status: { in: [...RESOLVABLE_REPORT_STATUSES] },
			},
			data: { status: "RESOLVED" },
		});
	}
	return {
		validCount,
		resolved: hasResolutionQuorum(validCount),
	};
}

export async function submitResolutionValidation(
	data: SubmitResolutionValidationInput,
): Promise<SubmitResolutionValidationResult> {
	const session = await ensureSession();
	if (!isObjectId(data.reportId)) throw new Error("Laporan tidak valid.");
	if (!isValidJpegDataUrl(data.imageDataUrl)) {
		throw new Error("Foto bukti tidak valid atau terlalu besar.");
	}

	const context = await getEligibilityContext(data.reportId, session.user.id);
	if (context.existingValidation) {
		const result = await finalizeResolution(data.reportId);
		return {
			validationId: context.existingValidation.id,
			validCount: result.validCount,
			requiredCount: REPORT_RESOLUTION_REQUIRED_VALIDATIONS,
			resolved: result.resolved,
		};
	}
	const blockedReason = eligibilityError(context);
	if (blockedReason) throw new Error(blockedReason);

	const latitude = context.report.latitude;
	const longitude = context.report.longitude;
	if (typeof latitude !== "number" || typeof longitude !== "number") {
		throw new Error("Koordinat laporan tidak tersedia.");
	}
	const distanceMeters = haversineDistanceMeters(
		latitude,
		longitude,
		data.latitude,
		data.longitude,
	);
	if (distanceMeters > REPORT_RESOLUTION_MAX_DISTANCE_METERS) {
		throw new Error(
			`Kamu berada ${Math.round(distanceMeters)} meter dari laporan. Batas validasi adalah 500 meter.`,
		);
	}

	const evidence = verifyEvidenceToken({
		token: data.evidenceToken,
		reportId: data.reportId,
		userId: session.user.id,
		imageDataUrl: data.imageDataUrl,
	});
	if (!evidence) {
		throw new Error(
			"Pemeriksaan bukti sudah tidak valid. Ambil ulang foto untuk diperiksa kembali.",
		);
	}

	let imageUrl: string;
	try {
		imageUrl = await uploadImageDataUrl(data.imageDataUrl);
	} catch (error) {
		console.error("[ReportResolution] evidence upload failed", {
			reportId: data.reportId,
			userId: session.user.id,
			error: error instanceof Error ? error.message : String(error),
		});
		throw new Error(
			"Foto bukti belum dapat disimpan ke penyimpanan. Coba kirim kembali.",
		);
	}

	let validation: { id: string };
	try {
		validation = await prisma.reportResolutionValidation.create({
			data: {
				reportId: data.reportId,
				userId: session.user.id,
				description: data.description.trim(),
				image: imageUrl,
				latitude: data.latitude,
				longitude: data.longitude,
				distanceMeters,
				ecolensSummary: evidence.summary,
				visionModel: evidence.visionModel,
			},
			select: { id: true },
		});
	} catch (error) {
		const code = (error as { code?: unknown }).code;
		try {
			await deleteObjectByUrl(imageUrl);
		} catch (cleanupError) {
			console.error("[ReportResolution] uploaded evidence cleanup failed", {
				reportId: data.reportId,
				userId: session.user.id,
				imageUrl,
				error:
					cleanupError instanceof Error
						? cleanupError.message
						: String(cleanupError),
			});
		}
		if (code !== "P2002") throw error;
		const existing = await prisma.reportResolutionValidation.findUnique({
			where: {
				reportId_userId: { reportId: data.reportId, userId: session.user.id },
			},
			select: { id: true },
		});
		if (!existing) throw error;
		validation = existing;
	}

	const result = await finalizeResolution(data.reportId);
	return {
		validationId: validation.id,
		validCount: result.validCount,
		requiredCount: REPORT_RESOLUTION_REQUIRED_VALIDATIONS,
		resolved: result.resolved,
	};
}

export async function getCommunityReportDetail(reportId: string) {
	const session = await ensureSession();
	if (!isObjectId(reportId)) return null;

	const [report, viewer] = await Promise.all([
		prisma.report.findUnique({
			where: { id: reportId },
			include: {
				ecolensAnalysis: true,
				riskAssessment: true,
				user: { select: { id: true, name: true, image: true } },
				resolutionValidations: {
					orderBy: { createdAt: "asc" },
					include: {
						user: { select: { id: true, name: true, image: true } },
					},
				},
			},
		}),
		prisma.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, createdAt: true },
		}),
	]);
	if (!report || !viewer) return null;

	const { resolutionValidations, ...safeReport } = report;
	const viewerHasValidated = resolutionValidations.some(
		(validation) => validation.userId === viewer.id,
	);
	const blockCode = getResolutionBlockCode({
		reportStatus: report.status,
		reportUserId: report.userId,
		reportHasCoordinates:
			typeof report.latitude === "number" &&
			typeof report.longitude === "number",
		viewerUserId: viewer.id,
		viewerCreatedAt: viewer.createdAt,
		viewerHasValidated,
	});
	const resolution: ReportResolutionSummary = {
		validCount: resolutionValidations.length,
		requiredCount: REPORT_RESOLUTION_REQUIRED_VALIDATIONS,
		isResolved: report.status === "RESOLVED",
		viewerCanValidate: blockCode === null,
		viewerBlockCode: blockCode,
		viewerBlockReason: getResolutionBlockReason(blockCode),
		validations: resolutionValidations.map((validation) => ({
			id: validation.id,
			description: validation.description,
			image: validation.image,
			latitude: validation.latitude,
			longitude: validation.longitude,
			distanceMeters: validation.distanceMeters,
			ecolensSummary: validation.ecolensSummary,
			visionModel: validation.visionModel,
			createdAt: validation.createdAt,
			user: validation.user,
		})),
	};

	return {
		report: safeReport,
		resolution,
		viewer: { id: viewer.id, isOwner: report.userId === viewer.id },
	};
}
