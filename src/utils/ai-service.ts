import Groq from "groq-sdk";
import { systemPrompt } from "./system-prompt";

export class AIService {
  private groq: Groq;  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }

    this.groq = new Groq({
      apiKey: apiKey,
    });
  }

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    maxTokens: number = 1024
  ): Promise<any> {
    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      const completion = await this.groq.chat.completions.create({
        messages: messages,
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error("No response content received from Groq");
      }

      return JSON.parse(responseContent);
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error(`AI service failed: ${error}`);
    }
  }

  async generateFollowUpMessage(patientContext: {
    patientName: string;
    doctorName: string;
    organizationName: string;
    diagnosis?: string;
    prescription?: string;
    visitSummary: string;
    previousMessages: { sender: "patient" | "system"; text: string }[];
  }): Promise<{
    message: string;
    doctorInterventionRequired: boolean;
    endOfConversation: boolean;
  }> {
    const prompt = `
You will receive patient follow-up context. Respond appropriately using the system prompt rules.

Patient Context:
${JSON.stringify(patientContext, null, 2)}
  `;

    return await this.generateResponse(prompt, systemPrompt, 1024);
  }
}

export const aiService = new AIService();
