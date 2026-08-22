import { createServerFn } from "@tanstack/react-start";
import { getGroqClient } from "#/lib/groq";

interface ChatPayload {
  prompt: string;
}

export const generateChatCompletion = createServerFn({ method: "POST" })
  .validator((data: ChatPayload) => {
    // Basic validation
    if (!data.prompt || typeof data.prompt !== 'string') {
      throw new Error("Invalid prompt");
    }
    if (data.prompt.length > 5000) {
      throw new Error("Prompt too long (max 5000 characters)");
    }
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const groq = getGroqClient();

      // TODO: Add authentication check
      // const user = await getAuthUser();
      // if (!user) return { success: false, error: "Unauthorized" };

      // Call Groq API with system message
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful environmental risk assistant for Indonesia. Provide accurate, localized information about weather, air quality, and environmental hazards in Indonesian language.",
          },
          {
            role: "user",
            content: data.prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        return {
          success: false,
          error: "No response from AI model.",
        };
      }

      return {
        success: true,
        content: content.trim(),
      };
    } catch (error) {
      // Better error handling
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Don't expose internal errors in production
      if (errorMessage.includes("API key")) {
        return {
          success: false,
          error: "AI service configuration error.",
        };
      }
      
      if (errorMessage.includes("rate limit")) {
        return {
          success: false,
          error: "Too many requests. Please try again later.",
        };
      }

      return {
        success: false,
        error: "Gagal memproses permintaan AI. Silakan coba lagi.",
      };
    }
  });
