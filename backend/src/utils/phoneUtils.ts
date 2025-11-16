// backend/src/utils/phoneUtils.ts
// Centralized phone number normalization utility

/**
 * Normalizes Kenyan phone numbers to format: 07XXXXXXXX
 * Handles: +2547XXXXXXXX, 2547XXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length < 9 || digits.length > 12) {
    throw new Error("Invalid phone number format");
  }

  // Handle different formats
  if (digits.startsWith("254")) {
    // +254 or 254 format: convert to 0XXXXXXXX
    return "0" + digits.slice(3);
  } else if (digits.startsWith("7") && digits.length === 9) {
    // 7XXXXXXXX format: add leading 0
    return "0" + digits;
  } else if (digits.startsWith("0") && digits.length === 10) {
    // Already in 0XXXXXXXX format
    return digits;
  } else if (digits.length === 9) {
    // Assume it's missing the leading 0
    return "0" + digits;
  }

  throw new Error(`Invalid phone number format: ${phoneNumber}`);
}

/**
 * Validates if a phone number is a valid Kenyan number
 */
export function validateKenyanPhone(phoneNumber: string): boolean {
  try {
    const normalized = normalizePhoneNumber(phoneNumber);
    // Kenyan numbers: 07XXXXXXXX (10 digits starting with 07)
    return /^07\d{8}$/.test(normalized);
  } catch {
    return false;
  }
}

/**
 * Formats phone number for Africa's Talking (254XXXXXXXXX)
 */
export function formatForAfricaTalking(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  // Convert 07XXXXXXXX to 2547XXXXXXXX
  return "254" + normalized.slice(1);
}

