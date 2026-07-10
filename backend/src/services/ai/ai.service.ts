import { GoogleGenAI } from "@google/genai";
import { CRM_CLEANING_PROMPT } from "../../prompts/crm.prompt";

/**
 * Service to interact with Gemini API for raw record batch cleaning.
 */
export class AIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Process a batch of records through Gemini to clean names, emails, and extract phone parts.
   */
  public async cleanRecordsBatch(records: any[]): Promise<any[]> {
    if (this.ai) {
      try {
        const prompt = CRM_CLEANING_PROMPT.replace("{recordsJson}", JSON.stringify(records, null, 2));
        
        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        if (response.text) {
          const cleaned = JSON.parse(response.text);
          if (Array.isArray(cleaned)) {
            // Log matching count
            console.log(`[AI Service] Cleaned batch of ${records.length} records successfully using Gemini.`);
            return cleaned;
          }
        }
      } catch (error) {
        console.error("[AI Service] Gemini batch cleaning failed, falling back to local heuristic normalization:", error);
      }
    }

    // Heuristic normalization fallback if Gemini API is disabled, unavailable, or times out
    return this.runLocalHeuristics(records);
  }

  /**
   * Safe local fallback normalization when AI API calls fail or are skipped.
   */
  private runLocalHeuristics(records: any[]): any[] {
    return records.map((r) => {
      let phoneCountryCode: string | null = null;
      let phoneNationalNumber: string | null = null;
      const rawPhone = r.phone ? String(r.phone).trim() : "";

      if (rawPhone) {
        if (rawPhone.startsWith("+")) {
          // Identify country code (e.g. +1, +44, +91)
          const parts = rawPhone.match(/^(\+\d{1,4})\s*(.*)$/);
          if (parts) {
            phoneCountryCode = parts[1];
            phoneNationalNumber = parts[2].replace(/\D/g, "");
          } else {
            phoneNationalNumber = rawPhone.replace(/\D/g, "");
          }
        } else {
          phoneNationalNumber = rawPhone.replace(/\D/g, "");
        }
      }

      return {
        name: r.name ? String(r.name).trim().replace(/\b\w/g, (c) => c.toUpperCase()) : null,
        email: r.email ? String(r.email).trim().toLowerCase() : null,
        phone: rawPhone || null,
        phoneCountryCode,
        phoneNationalNumber,
        company: r.company ? String(r.company).trim() : null,
      };
    });
  }
}

export const aiService = new AIService();
