import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { ensureSession } from "#/lib/auth.functions";
import { getGroqClient } from "#/lib/groq";
import {
	type AnalyzeEcoLensInput,
	type AnalyzeEcoLensResult,
	ECO_LENS_CATEGORIES,
	ECO_LENS_URGENCIES,
	type EcoLensAnalysis,
	type EcoLensCategory,
	type EcoLensUrgency,
	MAX_ECO_LENS_IMAGE_BYTES,
	MAX_ECO_LENS_LOCATION_LENGTH,
} from "#/types/ecolens";

const DEFAULT_VISION_MODEL = "qwen/qwen3.6-27b";
const DATA_URL_PREFIX = "data:image/jpeg;base64,";
const MAX_DATA_URL_LENGTH =
	DATA_URL_PREFIX.length + Math.ceil((MAX_ECO_LENS_IMAGE_BYTES * 4) / 3) + 4;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1_000;
const MAX_ANALYSES_PER_WINDOW = 5;

type AnalysisRateLimit = {
	timestamps: number[];
	inFlight: boolean;
};

const analysisRateLimits = new Map<string, AnalysisRateLimit>();

function acquireAnalysisSlot(userId: string): boolean {
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_MS;

	for (const [key, state] of analysisRateLimits) {
		if (!state.inFlight && (state.timestamps.at(-1) ?? 0) < windowStart) {
			analysisRateLimits.delete(key);
		}
	}

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
	if (!current) return;

	analysisRateLimits.set(userId, { ...current, inFlight: false });
}

function validateInput(input: unknown): AnalyzeEcoLensInput {
	if (!input || typeof input !== "object") {
		throw new Error("INVALID_ECOLENS_INPUT");
	}

	const candidate = input as Record<string, unknown>;

	if (typeof candidate.imageDataUrl !== "string") {
		throw new Error("INVALID_ECOLENS_INPUT");
	}

	if (
		candidate.location !== undefined &&
		typeof candidate.location !== "string"
	) {
		throw new Error("INVALID_ECOLENS_INPUT");
	}

	const location = candidate.location?.trim();

	if (location && location.length > MAX_ECO_LENS_LOCATION_LENGTH) {
		throw new Error("INVALID_ECOLENS_INPUT");
	}

	return {
		imageDataUrl: candidate.imageDataUrl,
		location: location || undefined,
	};
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
	if (
		encoded.length % 4 !== 0 ||
		!encoded.startsWith("/9j/") ||
		!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
	) {
		return false;
	}

	return getBase64ByteLength(dataUrl) <= MAX_ECO_LENS_IMAGE_BYTES;
}

function asCategory(value: unknown): EcoLensCategory | null {
	if (typeof value !== "string") return null;

	const normalized = value.trim().toLowerCase();
	const directMatch = ECO_LENS_CATEGORIES.find(
		(category) => category.toLowerCase() === normalized,
	);

	if (directMatch) return directMatch;
	if (normalized.includes("sampah")) return "Sampah";
	if (normalized.includes("banjir") || normalized.includes("drainase")) {
		return "Drainase/Banjir";
	}
	if (
		normalized.includes("polusi") ||
		normalized.includes("pencemaran") ||
		normalized.includes("kualitas udara")
	) {
		return "Polusi";
	}
	if (normalized.includes("kebakaran") || normalized.includes("api")) {
		return "Kebakaran";
	}
	if (
		normalized.includes("fasilitas") ||
		normalized.includes("jalan") ||
		normalized.includes("infrastruktur")
	) {
		return "Fasilitas Rusak";
	}
	if (normalized.includes("lain")) return "Lainnya";

	return null;
}

function asUrgency(value: unknown): EcoLensUrgency | null {
	if (typeof value !== "string") return null;

	const normalized = value.trim().toLowerCase();
	return (
		ECO_LENS_URGENCIES.find(
			(urgency) => urgency.toLowerCase() === normalized,
		) ?? null
	);
}

function asBoundedText(value: unknown, maxLength: number): string | null {
	if (typeof value !== "string") return null;

	const text = value.replace(/\s+/g, " ").trim();
	if (!text || text.length > maxLength) return null;

	return text;
}

function cleanJsonText(rawText: string): string {
	let text = rawText.trim();
	// Hapus tag reasoning/thinking seperti <think>...</think> jika ada
	text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

	// Jika output dibungkus markdown codeblock ```json ... ```
	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fenceMatch?.[1]) {
		text = fenceMatch[1].trim();
	}

	// Ambil substring antara kurung kurawal pertama dan terakhir
	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		text = text.slice(firstBrace, lastBrace + 1);
	}

	return text;
}

function parseAnalysis(rawText: string): EcoLensAnalysis | null {
	let parsed: unknown;

	const cleaned = cleanJsonText(rawText);
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		return null;
	}

	if (!parsed || typeof parsed !== "object") return null;

	const candidate = parsed as Record<string, unknown>;
	const category = asCategory(candidate.category);
	const urgency = asUrgency(candidate.urgency);
	const summary = asBoundedText(candidate.summary, 500);
	const suggestedDescription = asBoundedText(
		candidate.suggestedDescription,
		1_000,
	);

	if (!category || !urgency || !summary || !suggestedDescription) {
		return null;
	}

	return { category, urgency, summary, suggestedDescription };
}

function safeErrorResult(error: unknown): AnalyzeEcoLensResult {
	const rawMessage = error instanceof Error ? error.message : String(error);
	const message = rawMessage.toLowerCase();
	console.error("[EcoLens Backend Error]:", error);

	if (message.includes("groq_api_key_missing") || message.includes("api key")) {
		return {
			success: false,
			code: "CONFIGURATION",
			message:
				"Layanan AI belum dikonfigurasi. Kamu tetap dapat mengisi laporan secara manual.",
			details: rawMessage,
		};
	}

	if (message.includes("rate") || message.includes("429")) {
		return {
			success: false,
			code: "RATE_LIMITED",
			message:
				"Layanan AI sedang sibuk. Coba lagi sebentar atau lanjutkan secara manual.",
			details: rawMessage,
		};
	}

	return {
		success: false,
		code: "AI_UNAVAILABLE",
		message:
			"Foto belum dapat dianalisis. Coba lagi atau lanjutkan secara manual.",
		details: rawMessage,
	};
}

export const analyzeEcoLens = createServerFn({ method: "POST" })
	.validator(validateInput)
	.handler(async ({ data }): Promise<AnalyzeEcoLensResult> => {
		setResponseHeader("Cache-Control", "no-store");

		let userId: string;

		try {
			const session = await ensureSession();
			userId = session.user.id;
		} catch (error) {
			console.error("[EcoLens Backend] Auth check failed:", error);
			return {
				success: false,
				code: "UNAUTHORIZED",
				message:
					"Sesi kamu sudah berakhir. Masuk kembali untuk menggunakan Eco Lens.",
				details: error instanceof Error ? error.message : String(error),
			};
		}

		if (!isValidJpegDataUrl(data.imageDataUrl)) {
			console.error("[EcoLens Backend] Invalid JPEG data URL");
			return {
				success: false,
				code: "INVALID_IMAGE",
				message:
					"Foto tidak valid atau terlalu besar. Ambil ulang foto dan coba lagi.",
				details:
					"Format gambar bukan JPEG base64 yang valid atau melebihi batas ukuran 3MB.",
			};
		}

		if (!acquireAnalysisSlot(userId)) {
			console.warn("[EcoLens Backend] Rate limit exceeded for user:", userId);
			return {
				success: false,
				code: "RATE_LIMITED",
				message:
					"Terlalu banyak permintaan analisis. Tunggu beberapa menit sebelum mencoba lagi.",
				details:
					"Mencapai batas 5 permintaan per 5 menit atau analisis sebelumnya masih berlangsung.",
			};
		}

		try {
			const groq = getGroqClient();
			const modelName = process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL;
			const completion = await groq.chat.completions.create({
				model: modelName,
				messages: [
					{
						role: "system",
						content: `Kamu adalah Eco Lens, asisten AI klasifikasi masalah lingkungan dan infrastruktur di Indonesia.
Analisis hanya bukti visual yang tampak pada gambar yang diunggah.
Wajib berikan output HANYA dalam format JSON valid (tanpa teks penjelasan pembuka/penutup dan tanpa markdown) dengan struktur:
{
  "category": "Sampah" | "Drainase/Banjir" | "Polusi" | "Kebakaran" | "Fasilitas Rusak" | "Lainnya",
  "urgency": "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi",
  "summary": "Ringkasan visual singkat dalam bahasa Indonesia",
  "suggestedDescription": "Deskripsi detail laporan faktual dalam bahasa Indonesia"
}`,
					},
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `Analisis foto lingkungan ini. Konteks lokasi: ${data.location?.trim() || "Tidak ada"}. Balas hanya dengan objek JSON sesuai format di atas.`,
							},
							{
								type: "image_url",
								image_url: { url: data.imageDataUrl },
							},
						],
					},
				],
				temperature: 0.1,
				max_completion_tokens: 1024,
			});

			const rawText = completion.choices[0]?.message?.content;
			const analysis = rawText ? parseAnalysis(rawText) : null;

			if (!analysis) {
				console.error(
					"[EcoLens Backend] Gagal mem-parse response AI. Raw response:",
					rawText,
				);
				return {
					success: false,
					code: "INVALID_RESPONSE",
					message:
						"Hasil AI belum dapat dibaca. Coba lagi atau lanjutkan secara manual.",
					details: rawText
						? `Respons AI tidak sesuai format JSON yang diharapkan: ${rawText}`
						: "Respons AI kosong",
				};
			}

			return { success: true, analysis };
		} catch (error) {
			console.error("[EcoLens Backend] Exception saat request AI:", error);
			return safeErrorResult(error);
		} finally {
			releaseAnalysisSlot(userId);
		}
	});
