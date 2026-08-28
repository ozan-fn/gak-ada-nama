import { getGroqClient } from "#/lib/groq";

const INSIGHT_MODEL = "qwen/qwen3.6-27b";
const INSIGHT_GENERATION_TIMEOUT_MS = 15_000;
const MAX_SUMMARY_LENGTH = 600;

type InsightGenerationInput = {
	category: string;
	locationName: string;
	reportCount: number;
	validatedCount: number;
	impactScore: number;
	reports: Array<{
		title: string;
		description: string;
		urgency: string;
	}>;
	factors: string[];
};

type InsightGenerationResult = {
	title: string;
	summary: string;
	factors: string[];
	potentialImpacts: string[];
	whyRisks: string[];
};

function truncate(value: string, max: number): string {
	const text = value.replace(/\s+/g, " ").trim();
	return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function cleanJsonText(rawText: string): string {
	let text = rawText.trim();
	text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fenceMatch?.[1]) text = fenceMatch[1].trim();
	return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTextList(value: unknown, maxItems: number): string[] | null {
	if (!Array.isArray(value) || value.length === 0) return null;
	const items = value
		.slice(0, maxItems)
		.map((item) =>
			typeof item === "string"
				? item.replace(/\s+/g, " ").trim()
				: null,
		)
		.filter((item): item is string => item !== null && item.length > 0 && item.length <= 300);
	return items.length > 0 ? items : null;
}

function parseInsightResponse(rawText: string): InsightGenerationResult | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleanJsonText(rawText));
	} catch {
		return null;
	}

	if (!isRecord(parsed)) return null;

	const title =
		typeof parsed.title === "string"
			? truncate(parsed.title, 120)
			: null;
	const summary =
		typeof parsed.summary === "string"
			? truncate(parsed.summary, MAX_SUMMARY_LENGTH)
			: null;

	const factors = parseTextList(parsed.factors, 6);
	const potentialImpacts = parseTextList(parsed.potentialImpacts, 6);
	const whyRisks = parseTextList(parsed.whyRisks, 6);

	if (!title || !summary) return null;

	return {
		title,
		summary,
		factors: factors ?? [],
		potentialImpacts: potentialImpacts ?? [],
		whyRisks: whyRisks ?? [],
	};
}

export async function generateInsightContent(
	input: InsightGenerationInput,
): Promise<InsightGenerationResult | null> {
	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		INSIGHT_GENERATION_TIMEOUT_MS,
	);

	try {
		const groq = getGroqClient();

		const reportSummaries = input.reports
			.map(
				(r, i) =>
					`[${i + 1}] "${truncate(r.title, 80)}" - ${truncate(r.description, 150)} (urgensi: ${r.urgency})`,
			)
			.join("\n");

		const userPrompt = `Analisis berikut isu lingkungan yang terdeteksi dari ${input.reportCount} laporan masyarakat di ${input.locationName}.

Kategori: ${input.category}
Jumlah laporan: ${input.reportCount}
Laporan tervalidasi: ${input.validatedCount}
Impact score: ${input.impactScore}/100

Laporan:
${reportSummaries}

Faktor-faktor yang diketahui:
${input.factors.map((f) => `- ${f}`).join("\n")}

Berdasarkan data di atas, buatkan:
1. title: Judul singkat yang menggambarkan isu utama (maks 100 karakter, dalam bahasa Indonesia)
2. summary: Ringkasan analisis 2-3 kalimat tentang kondisi dan potensi risiko (bahasa Indonesia, faktual, jangan mengarang data yang tidak ada)
3. factors: Daftar faktor penyebab (1-5 item, singkat)
4. potentialImpacts: Daftar dampak potensial yang mungkin terjadi (1-5 item)
5. whyRisks: Alasan mengapa risiko ini perlu diperhatikan (1-5 item)

Balas HANYA dengan JSON valid:
{"title":"","summary":"","factors":[],"potentialImpacts":[],"whyRisks":[]}`;

		const completion = await groq.chat.completions.create(
			{
				model: INSIGHT_MODEL,
				messages: [
					{
						role: "system",
						content:
							"Kamu adalah analis lingkungan Indonesia. Buat analisis berdasarkan data laporan masyarakat. Jangan mengarang informasi yang tidak tersedia dalam data. Gunakan bahasa Indonesia yang jelas dan faktual.",
					},
					{ role: "user", content: userPrompt },
				],
				response_format: { type: "json_object" },
				reasoning_format: "hidden",
				reasoning_effort: "none",
				temperature: 0.2,
				max_completion_tokens: 600,
			},
			{ signal: controller.signal },
		);

		const rawText = completion.choices[0]?.message?.content;
		if (!rawText) return null;

		return parseInsightResponse(rawText);
	} catch (error) {
		const aborted = controller.signal.aborted;
		console.error("[InsightGeneration] failed", {
			error: aborted ? "TIMEOUT" : error instanceof Error ? error.message : String(error),
			category: input.category,
			locationName: input.locationName,
		});
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
