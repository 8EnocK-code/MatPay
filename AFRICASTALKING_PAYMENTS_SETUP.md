# Africa's Talking Payments API Setup Guide

## Issue: Endpoint Not Found

If you're getting `ENOTFOUND` or `404` errors, the endpoint URL might need to be verified from your Africa's Talking dashboard.

## Steps to Find the Correct Endpoint

1. **Log into Africa's Talking Dashboard:**
   - Go to https://account.africastalking.com
   - Navigate to your Payments/Products section

2. **Check Your Product Configuration:**
   - Note your Product Name (e.g., "MatatuPay")
   - Check if there's a specific endpoint URL shown in the dashboard

3. **Verify API Credentials:**
   - Ensure `AT_USERNAME` matches your dashboard username
   - Ensure `AT_API_KEY` is the correct API key (not the app key)

## Common Endpoint Formats

The code now tries these endpoints in order:

1. `https://api.sandbox.africastalking.com/version1/payment/mobile/checkout`
2. `https://api.sandbox.africastalking.com/payment/mobile/checkout`
3. `https://api.sandbox.africastalking.com/payments/mobile/checkout/request`
4. `https://payments.sandbox.africastalking.com/mobile/checkout/request` (may not resolve)

## Environment Variables Required

```env
AT_USERNAME=sandbox  # or your actual username
AT_API_KEY=your_api_key_here
AT_PRODUCT_NAME=MatatuPay  # Must match exactly what's in your dashboard
```

## Testing the Endpoint

You can test which endpoint works by checking the console logs. The code will:
1. Try each endpoint in sequence
2. Log which one it's trying
3. Use the first one that works
4. Show all tried URLs if none work

## If All Endpoints Fail

1. **Contact Africa's Talking Support:**
   - They can provide the exact endpoint for your account
   - They can verify your API credentials

2. **Check Your Account Status:**
   - Ensure Payments API is enabled for your account
   - Verify you're using the correct environment (sandbox vs production)

3. **Verify Product Name:**
   - The product name must match exactly (case-sensitive)
   - Check your dashboard for the exact product name

## Alternative: Use Africa's Talking SDK (if available)

If the SDK has a payments module in a newer version, you might need to:
```bash
npm install africastalking@latest
```

Then check if `AT.PAYMENTS` is available in the latest version.

## Current Implementation

The code automatically tries multiple endpoint formats and will use the first one that works. Check your backend console logs to see which endpoint is being tried and what errors you're getting.

