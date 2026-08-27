import type { AutomaticReportCandidate } from "#/lib/automatic-report-detection";
import { getGroqClient } from "#/lib/groq";

const DEFAULT_MODEL = "qwen/qwen3.6-27b";
const NARRATIVE_TIMEOUT_MS = 10_000;
const FORBIDDEN_HUMAN_CLAIMS = [
	/\bbau\b/i,
	/\bfoto\b/i,
	/tercium/i,
	/saya melihat/i,
	/saksi/i,
	/warga melaporkan/i,
	/foto menunjukkan/i,
	/dilaporkan oleh masyarakat/i,
	/pembakaran sampah/i,
];

export type AutomaticReportNarrative = {
	title: string;
	description: string;
	model: string | null;
	usedFallback: boolean;
};

export function parseAutomaticReportNarrative(
	raw: string,
): Pick<AutomaticReportNarrative, "title" | "description"> | null {
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		if (
			Object.keys(parsed).some(
				(key) => key !== "title" && key !== "description",
			)
		) {
			return null;
		}
		if (
			typeof parsed.title !== "string" ||
			typeof parsed.description !== "string"
		) {
			return null;
		}

		const title = parsed.title.replace(/\s+/g, " ").trim();
		const description = parsed.description.replace(/\s+/g, " ").trim();
		const combined = `${title} ${description}`;

		if (
			!title ||
			title.length > 120 ||
			!description ||
			description.length > 800 ||
			!/(terdeteksi|indikasi|potensi)/i.test(combined) ||
			!/sistem pemantauan lingkungan/i.test(description) ||
			FORBIDDEN_HUMAN_CLAIMS.some((pattern) => pattern.test(combined))
		) {
			return null;
		}

		return { title, description };
	} catch {
		return null;
	}
}

export async function generateAutomaticReportNarrative(
	candidate: AutomaticReportCandidate,
): Promise<AutomaticReportNarrative> {
	const model =
		process.env.GROQ_AUTOMATIC_REPORT_MODEL?.trim() ||
		process.env.GROQ_RISK_MODEL?.trim() ||
		DEFAULT_MODEL;
	const fallback = {
		title: candidate.fallbackTitle,
		description: candidate.fallbackDescription,
		model: null,
		usedFallback: true,
	};
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), NARRATIVE_TIMEOUT_MS);

	try {
		const completion = await getGroqClient().chat.completions.create(
			{
				model,
				messages: [
					{
						role: "system",
						content: `Kamu menulis laporan pemantauan lingkungan otomatis dalam bahasa Indonesia. Gunakan hanya fakta yang diberikan. Jangan mengarang foto, bau, saksi, kerusakan, pengamatan manusia, atau penyebab yang tidak dibuktikan. Gunakan istilah "terdeteksi", "indikasi", atau "potensi". Untuk hotspot tanpa bukti lokasi pembuangan, sebut "indikasi pembakaran terbuka", bukan "pembakaran sampah". Deskripsi wajib menyebut bahwa verifikasi berasal dari sistem pemantauan lingkungan. Balas hanya JSON: {"title":"maksimal 120 karakter","description":"maksimal 800 karakter"}.`,
					},
					{
						role: "user",
						content: JSON.stringify({
							category: candidate.category,
							urgency: candidate.urgency,
							region: candidate.regionName,
							observedAt: candidate.observedAt.toISOString(),
							evidence: candidate.evidence,
							facts: candidate.facts,
							coordinateSource: candidate.coordinateSource,
							accuracyRadiusMeters: candidate.accuracyRadiusMeters,
						}),
					},
				],
				response_format: { type: "json_object" },
				reasoning_format: "hidden",
				reasoning_effort: "none",
				temperature: 0.1,
				max_completion_tokens: 350,
			},
			{ signal: controller.signal },
		);
		const raw = completion.choices[0]?.message?.content;
		const narrative = raw ? parseAutomaticReportNarrative(raw) : null;
		return narrative ? { ...narrative, model, usedFallback: false } : fallback;
	} catch {
		return fallback;
	} finally {
		clearTimeout(timeout);
	}
}
