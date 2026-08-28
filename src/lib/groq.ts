import Groq from "groq-sdk";

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
	const apiKey = process.env.GROQ_API_KEY;

	if (!apiKey) {
		throw new Error("GROQ_API_KEY_MISSING");
	}

	if (!groqClient) {
		groqClient = new Groq({ apiKey });
	}

	return groqClient;
}
