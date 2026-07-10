/**
 * Optimized prompt template for fast Gemini CRM cleansing and formatting.
 */

export const CRM_CLEANING_PROMPT = `
You are an automated CRM cleansing pipeline. Perform these transformations on each contact record:
1. Name: Capitalize first letters, trim extra spaces.
2. Email: Convert to lowercase, remove spaces, verify format.
3. Phone: Identify dial country code (e.g., "+1", "+91") and clean national number digits.
4. Company: Trim and format properly.

Return ONLY a raw JSON array of objects. Do NOT wrap in markdown blocks like \`\`\`json or add explanations.

Schema:
- "name": string or null
- "email": string or null
- "phone": string or null
- "phoneCountryCode": string or null
- "phoneNationalNumber": string or null
- "company": string or null

Records to process:
{recordsJson}
`;
