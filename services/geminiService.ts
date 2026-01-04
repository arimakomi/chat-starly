
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async *getChatResponseStream(prompt: string, history: { role: 'user' | 'model', text: string }[]) {
    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: "You are a friendly AI assistant in GeminiGram. Respond in Persian. Keep it conversational and brief. Use emojis.",
          temperature: 0.8,
        }
      });

      for await (const chunk of responseStream) {
        yield chunk.text;
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      yield "خطایی در برقراری ارتباط با هوش مصنوعی رخ داد.";
    }
  }
}

export const gemini = new GeminiService();
