import { GoogleGenAI } from "@google/genai";

export interface HeaderMapping {
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
}

/**
 * Maps arbitrary CSV headers to standard CRM target fields.
 * If GEMINI_API_KEY is available, it queries Gemini for semantic mapping.
 * Otherwise, it falls back to a regex-based synonym matcher.
 */
export async function mapHeaders(headers: string[]): Promise<HeaderMapping> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
You are an expert CRM data mapping assistant.
Your task is to map CSV column headers to our target CRM fields:
1. "name" (required) - The contact's name (e.g., Full Name, FirstName LastName, Name, Customer, Client).
2. "email" (required) - The contact's email address (e.g., Email, E-mail, Mail Address, Contact Email).
3. "phone" (optional) - The contact's phone number (e.g., Phone, Tel, Mobile, Telephone, Ph No).
4. "company" (optional) - The company or organization name (e.g., Company, Employer, Organization, Corp, Business).

Given the following list of CSV headers:
${JSON.stringify(headers)}

Provide a JSON object containing the best mapping. If a target field cannot be mapped from the list, map it to null.
The output MUST be a valid JSON object matching this schema (do not include markdown formatting or backticks, just the raw JSON):
{
  "name": "matching_csv_header_or_null",
  "email": "matching_csv_header_or_null",
  "phone": "matching_csv_header_or_null",
  "company": "matching_csv_header_or_null"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        const mapping = JSON.parse(response.text) as HeaderMapping;
        // Post-validation: Ensure returned headers are present in the list
        const result: HeaderMapping = {
          name: headers.includes(String(mapping.name)) ? mapping.name : null,
          email: headers.includes(String(mapping.email)) ? mapping.email : null,
          phone: headers.includes(String(mapping.phone)) ? mapping.phone : null,
          company: headers.includes(String(mapping.company)) ? mapping.company : null,
        };
        console.log("[AI Mapper] Successfully mapped headers using Gemini:", result);
        return result;
      }
    } catch (error) {
      console.warn("[AI Mapper] Gemini API mapping failed; falling back to heuristics:", error);
    }
  }

  // Fallback to heuristic semantic matcher
  return runHeuristicMapper(headers);
}

/**
 * Simple regex-based synonym matcher for CRM columns
 */
function runHeuristicMapper(headers: string[]): HeaderMapping {
  const mapping: HeaderMapping = {
    name: null,
    email: null,
    phone: null,
    company: null,
  };

  const namePatterns = [
    /^(full\s*name|name|first\s*name|customer|client|contact\s*name|contact)$/i,
    /name/i,
  ];
  const emailPatterns = [
    /^(email|e-mail|mail|email\s*address|e-mail\s*address)$/i,
    /email/i,
    /mail/i,
  ];
  const phonePatterns = [
    /^(phone|tel|telephone|mobile|ph\s*no|ph|cell)$/i,
    /phone/i,
    /tel/i,
    /mobile/i,
  ];
  const companyPatterns = [
    /^(company|employer|organization|org|corp|business|work)$/i,
    /company/i,
    /employer/i,
    /org/i,
    /corp/i,
  ];

  const findMatch = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const match = headers.find((h) => pattern.test(h));
      if (match) return match;
    }
    return null;
  };

  mapping.name = findMatch(namePatterns);
  mapping.email = findMatch(emailPatterns);
  mapping.phone = findMatch(phonePatterns);
  mapping.company = findMatch(companyPatterns);

  console.log("[AI Mapper] Mapped headers using semantic heuristics (fallback):", mapping);
  return mapping;
}
