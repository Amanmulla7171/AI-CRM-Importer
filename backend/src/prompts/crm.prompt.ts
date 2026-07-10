/**
 * Prompt templates for Gemini AI cleaning and formatting.
 */

export const CRM_CLEANING_PROMPT = `
You are an expert CRM data cleansing assistant. Your task is to process a batch of contact records that have been mapped to target CRM fields.

For each contact record in the list, please analyze, clean, and enrich the fields:
1. **Name**: Capitalize first letters of names, remove duplicate whitespaces, and trim.
2. **Email**: Convert to lowercase, remove any accidental spaces, and check if it has a valid format.
3. **Phone**: Analyze the phone number. Identify the country dial code (e.g., "+1", "+91") and the national number. Remove any non-numeric symbols from the national number.
4. **Company**: Capitalize properly and trim.

Return a JSON array of objects with the exact keys:
- "name": string (cleaned name, or null)
- "email": string (cleaned email, or null)
- "phone": string (full cleaned phone string, or null)
- "phoneCountryCode": string (country code like "+1", "+91", or null if not found)
- "phoneNationalNumber": string (cleaned national number digits, or null)
- "company": string (cleaned company name, or null)

Do NOT include any markdown block formatting like \`\`\`json or any introductory text. Return ONLY the raw valid JSON array.

Records to process:
{recordsJson}
`;
