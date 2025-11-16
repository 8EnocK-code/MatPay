import { initiateStkPush as atInitiateStkPush } from "./africastalkingService";
import { normalizePhoneNumber, validateKenyanPhone } from "../utils/phoneUtils";

export interface MpesaPaymentResult {
  success: boolean;
  providerResp?: any;
  error?: string;
  transactionId?: string;
  checkoutRequestId?: string;
}

export async function initiateMpesaPayment({ phoneNumber, amount, reference }: {
  phoneNumber: string;
  amount: number;
  reference: string;
}): Promise<MpesaPaymentResult> {
  // Check configuration
  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    return {
      success: false,
      error: "Africa's Talking is not configured. Add AT_API_KEY and AT_USERNAME to .env",
    };
  }

  // Validate inputs
  try {
    if (!validateKenyanPhone(phoneNumber)) {
      return {
        success: false,
        error: "Invalid Kenyan phone number format",
      };
    }

    if (!amount || amount <= 0) {
      return {
        success: false,
        error: "Amount must be greater than 0",
      };
    }

    if (amount < 1) {
      return {
        success: false,
        error: "Minimum amount is KES 1",
      };
    }

    if (!reference || reference.trim().length === 0) {
      return {
        success: false,
        error: "Reference is required",
      };
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Initiate STK Push
    const response = await atInitiateStkPush({
      phoneNumber: normalizedPhone,
      amount,
      reference,
    });

    // Extract transaction details from response
    const transactionId = response?.transactionId || response?.transactionReference || response?.providerReferenceId;
    const checkoutRequestId = response?.checkoutRequestId || response?.requestId;

    return {
      success: true,
      providerResp: response,
      transactionId,
      checkoutRequestId,
    };
  } catch (err: any) {
    console.error("MPesa STK Push Error:", {
      error: err.message,
      stack: err.stack,
      phoneNumber,
      amount,
      reference,
    });

    return {
      success: false,
      error: err?.message || "STK Push failed. Please try again.",
    };
  }
}

// maintain backward compatibility
export const initiateStkPush = initiateMpesaPayment;

export default { initiateMpesaPayment };
