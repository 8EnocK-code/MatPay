import axios from "axios";
import { formatForAfricaTalking, normalizePhoneNumber } from "../utils/phoneUtils";

// Africa's Talking API configuration
function getATConfig() {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;

  if (!username || !apiKey) {
    throw new Error("Africa's Talking is not configured. Add AT_USERNAME and AT_API_KEY to .env");
  }

  const isSandbox = username.toLowerCase() === "sandbox";
  // All Africa's Talking services use the main API domain
  const baseURL = isSandbox
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";

  return {
    username,
    apiKey,
    baseURL,
    authHeader: `Basic ${Buffer.from(`${username}:${apiKey}`).toString("base64")}`,
  };
}

export async function initiateStkPush({ phoneNumber, amount, reference }: {
  phoneNumber: string;
  amount: number;
  reference: string;
}) {
  // Get product name from env or use default
  const productName = process.env.AT_PRODUCT_NAME || "MatatuPay";
  
  // Normalize and format phone number for Africa's Talking
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const formattedPhone = formatForAfricaTalking(normalizedPhone);

  // Validate amount
  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Validate reference
  if (!reference || reference.trim().length === 0) {
    throw new Error("Reference is required");
  }

  const config = getATConfig();
  const isSandbox = config.username.toLowerCase() === "sandbox";

  try {
    // Africa's Talking Payments API endpoint
    // Correct format: /version1/payment/mobile/checkout/request
    // Try multiple possible endpoint formats as fallback
    const possibleUrls = [
      `${config.baseURL}/version1/payment/mobile/checkout/request`, // Correct format per AT docs
      `${config.baseURL}/version1/payment/mobile/checkout`,
      `${config.baseURL}/payment/mobile/checkout/request`,
      `${config.baseURL}/payment/mobile/checkout`,
    ];
    
    // Build form-urlencoded payload (required by AT Payments API)
    const formData = new URLSearchParams();
    formData.append("username", config.username);
    formData.append("productName", productName);
    formData.append("phoneNumber", formattedPhone);
    formData.append("currencyCode", "KES");
    formData.append("amount", Math.round(amount).toString());
    formData.append("metadata", JSON.stringify({ reference }));

    console.log("AT STK Push Request:", {
      tryingUrls: possibleUrls,
      productName,
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      reference,
      username: config.username,
    });

    // Try each URL until one works
    let response;
    let lastError: any = null;
    let triedUrls: string[] = [];

    for (const tryUrl of possibleUrls) {
      try {
        console.log(`Trying endpoint: ${tryUrl}`);
        response = await axios.post(tryUrl, formData.toString(), {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "apiKey": config.apiKey,
          },
          timeout: 30000,
        });
        console.log(`Success with endpoint: ${tryUrl}`);
        break; // Success, exit loop
      } catch (error: any) {
        triedUrls.push(tryUrl);
        lastError = error;
        
        // If it's ENOTFOUND (DNS error), skip this URL and try next
        if (error.code === "ENOTFOUND") {
          console.log(`DNS error for ${tryUrl}, trying next...`);
          continue;
        }
        
        // If it's 404, try next URL
        if (error.response?.status === 404) {
          console.log(`404 error for ${tryUrl}, trying next...`);
          continue;
        }
        
        // For other errors (auth, validation, etc.), throw immediately
        throw error;
      }
    }

    // If we tried all URLs and none worked
    if (!response) {
      throw new Error(
        `Payments API endpoint not accessible. ` +
        `Tried URLs: ${triedUrls.join(", ")}. ` +
        `Last error: ${lastError?.message || "Unknown error"}. ` +
        `\n\nPlease verify:\n` +
        `1. Your AT_USERNAME and AT_API_KEY are correct in .env\n` +
        `2. The product name "${productName}" exists in your Africa's Talking dashboard\n` +
        `3. Your account has Payments API access enabled\n` +
        `4. Check Africa's Talking documentation for the correct endpoint for your region`
      );
    }

    console.log("AT STK Push Response:", response.data);

    // Return response in a format similar to what the SDK would return
    return {
      transactionId: response.data?.transactionId || response.data?.providerReferenceId,
      transactionReference: response.data?.transactionId || response.data?.providerReferenceId,
      checkoutRequestId: response.data?.checkoutRequestId || response.data?.requestId,
      providerReferenceId: response.data?.providerReferenceId,
      ...response.data,
    };
  } catch (error: any) {
    console.error("Africa's Talking STK Push Error:", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      phoneNumber: formattedPhone,
      amount,
      reference,
    });

    // Extract error message from response
    const errorMessage = error.response?.data?.errorMessage || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to initiate STK Push";

    throw new Error(errorMessage);
  }
}

