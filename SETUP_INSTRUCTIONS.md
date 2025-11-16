# Setup Instructions for Africa's Talking Integration

## Summary of Changes

✅ **Completed:**
1. Updated Prisma Payment model with Africa's Talking fields (`providerRef`, `checkoutRequest`, `providerRaw`, `confirmedAt`)
2. Created Africa's Talking STK Push service (`backend/src/services/africastalkingService.ts`)
3. Created new payment controller using AT instead of Daraja (`backend/src/controllers/paymentsController.ts`)
4. Created payment routes (`backend/src/routes/paymentsRoutes.ts`) - mounted at `/api/pay`
5. Created owner controller for user creation (`backend/src/controllers/ownerController.ts`)
6. Created owner routes (`backend/src/routes/ownerRoutes.ts`) - mounted at `/api/owner`
7. Created analytics controller for revenue split (`backend/src/controllers/analyticsController.ts`)
8. Created analytics routes (`backend/src/routes/analyticsRoutes.ts`) - mounted at `/api/owner`
9. Created frontend pie chart component (`frontend/src/components/RevenuePieChart.tsx`)
10. Created revenue analytics page (`frontend/src/pages/RevenueAnalytics.tsx`)
11. Added route to frontend App.tsx for `/revenue-analytics`

## Required Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install africastalking
```

Note: `dotenv` is already installed. `bcryptjs` is already installed (used in ownerController).

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install chart.js react-chartjs-2
```

Note: `axios` is not needed as the project uses a custom `api` helper.

### 3. Update Environment Variables

Add to `backend/.env`:

```env
AT_USERNAME=sandbox
AT_API_KEY=SK_YOUR_SANDBOX_KEY
PUBLIC_BASE_URL=https://<your-ngrok>.ngrok-free.app
```

Keep existing `DATABASE_URL` and `JWT_SECRET` as-is.

### 4. Run Prisma Migration

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_payment_model
```

This will:
- Generate Prisma client with new Payment fields
- Create a migration for the Payment model updates

### 5. Setup ngrok (for callback URL)

```bash
ngrok http 4000
```

Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok-free.app`) and set it as `PUBLIC_BASE_URL` in `.env`.

### 6. Configure Africa's Talking Sandbox

1. Log into Africa's Talking Sandbox dashboard
2. Create a product named **"MatatuPay"** (must match the productName in `africastalkingService.ts`)
3. Set the mobile checkout callback URL to: `https://<your-ngrok>/api/pay/callback`
4. Ensure your test phone number is registered in the sandbox

### 7. Restart Backend Server

```bash
cd backend
npm run dev
```

## API Endpoints

### Payment Endpoints (New - Africa's Talking)

- `POST /api/pay/initiate`
  - Body: `{ "tripId": "uuid", "phoneNumber": "0712345678" }`
  - Returns: `{ "ok": true, "paymentId": "uuid", "providerResp": {...} }`

- `POST /api/pay/callback`
  - Called by Africa's Talking webhook
  - No manual calls needed

### Owner Endpoints (New)

- `POST /api/owner/users`
  - Requires: Owner role (JWT token with `role: "owner"`)
  - Body: `{ "name": "John Doe", "phoneNumber": "0712345678", "password": "password123", "role": "driver" | "conductor" }`
  - Returns: `{ "ok": true, "user": {...} }`

- `GET /api/owner/revenue-split`
  - Requires: Owner role
  - Returns: `{ "owner": 50, "driver": 30, "conductor": 20 }` (percentages)

## Testing

### Test Payment Flow

1. Create a trip in DB (via existing UI or Prisma Studio)
2. Call payment initiate:
   ```bash
   curl -X POST "http://localhost:4000/api/pay/initiate" \
     -H "Content-Type: application/json" \
     -d '{"tripId": "<trip-id>", "phoneNumber": "0712345678"}'
   ```
3. Watch for STK push on your test phone (AT Sandbox) or simulate callback:
   ```bash
   curl -X POST "https://<ngrok>/api/pay/callback" \
     -H "Content-Type: application/json" \
     -d '{
       "transactionId": "SIM_TX_1",
       "status": "Success",
       "providerReference": "SIM_REF_1",
       "amount": 50,
       "metadata": {"reference": "trip-<tripId>-<timestamp>"}
     }'
   ```
4. Confirm payment is marked `received` in DB and trip.status becomes `completed`

### Test Owner User Creation

```bash
curl -X POST "http://localhost:4000/api/owner/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <owner-jwt-token>" \
  -d '{
    "name": "Driver Name",
    "phoneNumber": "0712345678",
    "password": "password123",
    "role": "driver"
  }'
```

### Test Revenue Analytics

1. Navigate to `/revenue-analytics` in frontend (requires owner role)
2. Pie chart should display revenue split percentages

## Important Notes

- **Non-destructive**: All existing Daraja files remain untouched (`mpesaService.ts`, `mpesaController.ts`, `routes/mpesa.ts`)
- **New routes**: Payment routes are at `/api/pay` (separate from `/api/mpesa`)
- **Payment model**: Extended with AT fields but backward compatible with existing Daraja fields
- **Frontend**: Revenue analytics page is owner-only and accessible at `/revenue-analytics`

## Troubleshooting

- If AT callback fails: Check ngrok URL is accessible and `PUBLIC_BASE_URL` matches
- If STK push doesn't arrive: Verify product name "MatatuPay" exists in AT dashboard
- If payment not found in callback: Check `providerRef` or `checkoutRequest` matching logic
- If Prisma errors: Run `npx prisma generate` after schema changes

---

**When done, run the install + prisma + ngrok steps; then test with curl.**

