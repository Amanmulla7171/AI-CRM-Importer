import { TransformedCRMRecord } from "../transformers/crm.transformer";

export interface ValidationResult {
  status: "imported" | "failed" | "skipped";
  error?: string;
}

/**
 * Validator class to verify CRM field values and formats.
 */
export class CRMValidator {
  private emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validates contact details, setting status to 'imported' (success) or 'failed' (errors).
   */
  public validateRecord(record: TransformedCRMRecord): ValidationResult {
    // 1. Verify Name existence
    if (!record.name || record.name.trim() === "") {
      return {
        status: "failed",
        error: "Missing required field: Name",
      };
    }

    // 2. Verify Email existence
    if (!record.email || record.email.trim() === "") {
      return {
        status: "failed",
        error: "Missing required field: Email",
      };
    }

    // 3. Verify Email format
    if (!this.emailPattern.test(record.email)) {
      return {
        status: "failed",
        error: `Invalid email format: '${record.email}'`,
      };
    }

    // 4. Verify Phone digit ranges if phone number is provided
    if (record.phone) {
      const digits = record.phone.replace(/\D/g, "");
      if (digits.length > 0 && digits.length < 7) {
        return {
          status: "failed",
          error: `Phone number digits count too short: '${record.phone}' (must be at least 7 digits)`,
        };
      }
      if (digits.length > 15) {
        return {
          status: "failed",
          error: `Phone number digits count too long: '${record.phone}' (must not exceed 15 digits)`,
        };
      }
    }

    return {
      status: "imported",
    };
  }
}

export const crmValidator = new CRMValidator();
