# Wallet & Withdrawals System - Implementation Summary

## ✅ Completed Changes

### 1. Prisma Schema Updates

**File: `backend/prisma/schema.prisma`**
- ✅ Added `Wallet` model (one-to-one with User)
- ✅ Added `Withdrawal` model (many-to-one with User)
- ✅ Updated `User` model to include wallet and withdrawals relations

**Models Added:**
```prisma
model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Withdrawal {
  id         String   @id @default(uuid())
  userId     String
  amount     Int
  status     String   @default("PENDING") // PENDING | APPROVED | DECLINED
  requestedAt DateTime @default(now())
  processedAt DateTime?
  processedBy String?
  note       String?
  meta       Json?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 2. Middleware Updates

**File: `backend/src/middleware/requireOwner.ts`**
- ✅ Updated to allow both OWNER and SACCO roles
- ✅ Improved error messages

### 3. Controllers Created/Updated

**File: `backend/src/controllers/ownerUserController.ts`** (Updated)
- ✅ `ownerCreateStaff` - Now initializes wallet when creating drivers/conductors

**File: `backend/src/controllers/authController.ts`** (Updated)
- ✅ `changePassword` - Secure password change endpoint for all users

**File: `backend/src/controllers/walletController.ts`** (NEW)
- ✅ `getBalance` - Get user's wallet balance
- ✅ `requestWithdrawal` - Create withdrawal request and deduct balance

**File: `backend/src/controllers/ownerWithdrawalsController.ts`** (NEW)
- ✅ `listWithdrawals` - List all withdrawals (owner-only)
- ✅ `processWithdrawal` - Approve or decline withdrawals (owner-only)

### 4. Routes Created

**File: `backend/src/routes/walletRoutes.ts`** (NEW)
- `GET /api/wallet/balance` - Get balance (auth required)
- `POST /api/wallet/withdraw` - Request withdrawal (auth required)

**File: `backend/src/routes/ownerWithdrawalsRoutes.ts`** (NEW)
- `GET /api/owner/withdrawals` - List withdrawals (owner-only)
- `POST /api/owner/withdrawals/:id/process` - Process withdrawal (owner-only)

**File: `backend/src/routes/auth.ts`** (Updated)
- `POST /api/auth/change-password` - Change password (auth required)

**File: `backend/src/routes/index.ts`** (Updated)
- ✅ Mounted wallet routes at `/api/wallet`
- ✅ Mounted owner withdrawals routes at `/api/owner/withdrawals`

## 📁 Files Created

1. `backend/src/controllers/walletController.ts`
2. `backend/src/controllers/ownerWithdrawalsController.ts`
3. `backend/src/routes/walletRoutes.ts`
4. `backend/src/routes/ownerWithdrawalsRoutes.ts`

## 📝 Files Modified

1. `backend/prisma/schema.prisma` - Added Wallet and Withdrawal models
2. `backend/src/middleware/requireOwner.ts` - Allow SACCO role
3. `backend/src/controllers/ownerUserController.ts` - Initialize wallet on user creation
4. `backend/src/controllers/authController.ts` - Added changePassword
5. `backend/src/routes/auth.ts` - Added change-password route
6. `backend/src/routes/index.ts` - Mounted new routes

## 🔒 Security Features

- ✅ All endpoints require authentication (authMiddleware)
- ✅ Owner endpoints require OWNER or SACCO role (requireOwner)
- ✅ Passwords hashed with bcrypt (salt rounds = 10)
- ✅ Old password verification before change
- ✅ Wallet balance checked before withdrawal
- ✅ Balance deducted immediately to prevent double-spend
- ✅ Decline refunds balance automatically
- ✅ No direct mass-assignment - all fields mapped explicitly

## 🚀 Required Commands

### 1. Install Dependencies (if needed)
```bash
cd backend
npm install bcryptjs  # Already installed, but verify
```

### 2. Generate Prisma Client & Run Migration
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_wallet_withdrawals
```

### 3. Restart Backend Server
```bash
npm run dev
```

## 🧪 Testing Instructions

### Test 1: Create Driver/Conductor (Owner)
```bash
POST /api/owner/users
Headers: Authorization: Bearer <owner-token>
Body: {
  "name": "Jane Driver",
  "phoneNumber": "0712345678",
  "password": "pass1234",
  "role": "driver"
}
```
**Expected:** 201 Created with user object. Wallet automatically created with balance 0.

### Test 2: Check Wallet Balance (Any User)
```bash
GET /api/wallet/balance
Headers: Authorization: Bearer <user-token>
```
**Expected:** `{ "balance": 0 }`

### Test 3: Simulate Deposit (Manual - Prisma Studio)
- Open Prisma Studio: `npx prisma studio`
- Navigate to Wallet table
- Update `balance` to 1000 for test user

### Test 4: Request Withdrawal (User)
```bash
POST /api/wallet/withdraw
Headers: Authorization: Bearer <user-token>
Body: {
  "amount": 500,
  "note": "Cash needed"
}
```
**Expected:** 201 Created with withdrawal object. Wallet balance reduced to 500.

### Test 5: List Withdrawals (Owner)
```bash
GET /api/owner/withdrawals
Headers: Authorization: Bearer <owner-token>
```
**Expected:** List of all withdrawals with user info.

### Test 6: Approve Withdrawal (Owner)
```bash
POST /api/owner/withdrawals/<withdrawal-id>/process
Headers: Authorization: Bearer <owner-token>
Body: {
  "action": "approve",
  "note": "Approved for payout"
}
```
**Expected:** `{ "ok": true, "message": "withdrawal approved" }`

### Test 7: Decline Withdrawal (Owner)
```bash
POST /api/owner/withdrawals/<withdrawal-id>/process
Headers: Authorization: Bearer <owner-token>
Body: {
  "action": "decline",
  "note": "Insufficient funds"
}
```
**Expected:** `{ "ok": true, "message": "withdrawal declined and refunded" }`. Balance refunded.

### Test 8: Change Password (Any User)
```bash
POST /api/auth/change-password
Headers: Authorization: Bearer <user-token>
Body: {
  "oldPassword": "oldpass",
  "newPassword": "newpass123"
}
```
**Expected:** `{ "ok": true, "message": "Password changed" }`

## 📋 API Endpoints Summary

### Authentication
- `POST /api/auth/change-password` - Change password (auth required)

### Wallet
- `GET /api/wallet/balance` - Get balance (auth required)
- `POST /api/wallet/withdraw` - Request withdrawal (auth required)

### Owner Management
- `POST /api/owner/users` - Create driver/conductor (owner-only)
- `GET /api/owner/users` - List drivers/conductors (owner-only)
- `DELETE /api/owner/users/:userId` - Delete user (owner-only)

### Owner Withdrawals
- `GET /api/owner/withdrawals` - List all withdrawals (owner-only)
- `POST /api/owner/withdrawals/:id/process` - Approve/decline (owner-only)

## ⚠️ Important Notes

1. **Wallet Initialization:** Wallets are automatically created when owners create new drivers/conductors. Existing users need wallets created manually or via migration.

2. **Withdrawal Flow:**
   - User requests withdrawal → Balance deducted immediately
   - Owner approves → Status set to APPROVED (no external payout)
   - Owner declines → Status set to DECLINED, balance refunded

3. **No External Payouts:** The system does NOT perform actual MPesa B2C payouts. Owners must process payouts externally. Integration can be added later.

4. **Rate Limiting:** Consider adding rate limiting to `/api/wallet/withdraw` to prevent abuse.

5. **Existing Users:** Users created before this update won't have wallets. You may need to:
   - Create wallets manually via Prisma Studio
   - Or run a migration script to create wallets for existing users

## 🔄 Migration for Existing Users

If you have existing users without wallets, run this in Prisma Studio or create a migration script:

```typescript
// One-time script to create wallets for existing users
const usersWithoutWallets = await prisma.user.findMany({
  where: { wallet: null }
});

for (const user of usersWithoutWallets) {
  await prisma.wallet.create({
    data: { userId: user.id, balance: 0 }
  });
}
```

## ✅ Verification Checklist

- [x] Wallet model added to Prisma schema
- [x] Withdrawal model added to Prisma schema
- [x] requireOwner middleware updated (allows SACCO)
- [x] ownerUserController creates wallet on user creation
- [x] Password change endpoint created
- [x] Wallet balance endpoint created
- [x] Withdrawal request endpoint created
- [x] Owner withdrawals list endpoint created
- [x] Owner withdrawal process endpoint created
- [x] All routes mounted correctly
- [x] All endpoints protected with auth/role middleware
- [x] Passwords hashed securely
- [x] No linter errors

---

**Status**: ✅ All changes complete and non-destructive

**Next Steps:**
1. Run `npx prisma generate && npx prisma migrate dev --name add_wallet_withdrawals`
2. Restart backend server
3. Test endpoints as described above
4. Create wallets for existing users if needed
5. Optionally add frontend UI components for wallet and withdrawals

