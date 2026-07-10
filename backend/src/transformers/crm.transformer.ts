export interface CRMRecordInput {
  name: string | null;
  email: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  phoneNationalNumber: string | null;
  company: string | null;
}

export interface TransformedCRMRecord {
  id?: string;
  name: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
  company: string;
}

/**
 * Transformer service to clean, normalize, and format AI-cleaned records into standard CRM fields.
 */
export class CRMTransformer {
  /**
   * Transforms raw AI clean output into structured, normalized CRM records.
   */
  public transformRecord(input: any): TransformedCRMRecord {
    // 1. Format Name
    const name = input.name ? String(input.name).trim() : "";

    // 2. Clean Email: lowercase and remove any whitespaces
    const email = input.email ? String(input.email).toLowerCase().replace(/\s+/g, "") : "";

    // 3. Normalize Phone parts
    let countryCode = input.phoneCountryCode ? String(input.phoneCountryCode).trim() : "";
    if (countryCode && !countryCode.startsWith("+")) {
      countryCode = "+" + countryCode;
    }

    // National number is digits only
    const nationalNumber = input.phoneNationalNumber ? String(input.phoneNationalNumber).replace(/\D/g, "") : "";

    // Combine into unified format
    let phone = "";
    if (countryCode && nationalNumber) {
      phone = `${countryCode} ${nationalNumber}`;
    } else if (nationalNumber) {
      phone = nationalNumber;
    } else if (input.phone) {
      phone = String(input.phone).trim();
    }

    // 4. Format Company
    const company = input.company ? String(input.company).trim() : "";

    return {
      name,
      email,
      phone,
      phoneCountryCode: countryCode,
      phoneNationalNumber: nationalNumber,
      company,
    };
  }

  /**
   * Batch transforms multiple records.
   */
  public transformRecords(inputs: any[]): TransformedCRMRecord[] {
    return inputs.map((item) => this.transformRecord(item));
  }
}

export const crmTransformer = new CRMTransformer();
