# Matatu Revenue Management System - Backend

A production-ready backend for managing matatu (public transport) revenue, built with TypeScript, Node.js, Express, Prisma, and JWT authentication.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Conductor, Driver, Owner, Sacco)
- 🚌 Trip management with automatic fare calculation
- 💰 MPesa payment integration
- 📊 Revenue splitting and tracking
- 🔗 Blockchain-ready data hashing
- 🛡️ Idempotency for payment callbacks
- ⚡ Rate limiting and security headers

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your database URL, JWT secret, and MPesa credentials.

3. **Set up the database:**

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Start the development server:**

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or the PORT specified in your `.env`).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Trips

- `POST /api/trips` - Create a new trip (Conductor only)
- `GET /api/trips` - Get all trips for the authenticated user
- `GET /api/trips/:tripId` - Get a specific trip
- `POST /api/trips/:tripId/confirm` - Confirm a trip (Driver/Owner only)

### MPesa Payments

- `POST /api/mpesa/initiate` - Initiate STK push payment
- `POST /api/mpesa/callback` - MPesa callback endpoint (webhook)
- `GET /api/mpesa/status/:mpesaRequestId` - Check payment status

### Health Check

- `GET /health` - Server health check

## Example API Flow

### 1. Register a User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "phoneNumber": "254712345678",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "conductor"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phoneNumber": "254712345678",
    "role": "conductor"
  },
  "token": "jwt_token_here"
}
```

### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "254712345678",
  "password": "securepassword"
}
```

### 3. Create a Trip (Conductor)

```bash
POST /api/trips
Authorization: Bearer <token>
Content-Type: application/json

{
  "routeId": "route_uuid",
  "matatuId": "matatu_uuid",
  "driverId": "driver_uuid",
  "fareType": "normal",
  "passengerCount": 10
}
```

The system automatically calculates the fare based on the route and fare rules. Conductors cannot manually enter fare amounts.

### 4. Confirm Trip (Driver)

```bash
POST /api/trips/:tripId/confirm
Authorization: Bearer <driver_token>
```

### 5. Confirm Trip (Owner)

```bash
POST /api/trips/:tripId/confirm
Authorization: Bearer <owner_token>
```

When both driver and owner confirm, the revenue split is automatically calculated and stored.

### 6. Initiate Payment

```bash
POST /api/mpesa/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "tripId": "trip_uuid",
  "phoneNumber": "254712345678",
  "amount": 500
}
```

### 7. Payment Callback

MPesa will send a callback to `/api/mpesa/callback`. The system handles this automatically with idempotency checks.

### 8. Revenue Split

After payment is received and both driver/owner confirm the trip, the revenue is automatically split:
- Owner: 40%
- Driver: 25%
- Conductor: 15%
- Sacco: 15%
- Maintenance: 5%

## MPesa Testing Instructions

### Sandbox Setup

1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an app and get your credentials:
   - Consumer Key
   - Consumer Secret
   - Shortcode
   - Passkey
3. Update your `.env` file with these credentials
4. Set `MPESA_BASE_URL` to `https://sandbox.safaricom.co.ke`
5. Set `MPESA_CALLBACK_BASE` to your server's public URL (use ngrok for local testing)

### Testing with ngrok (Local Development)

1. Install ngrok: `npm install -g ngrok`
2. Start your backend server
3. In another terminal, run: `ngrok http 4000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update `.env`: `MPESA_CALLBACK_BASE=https://abc123.ngrok.io`
6. Restart your server

### Test Phone Numbers

Use Safaricom test numbers:
- `254708374149` - Success
- `254712345678` - User cancelled
- `254700000000` - Insufficient funds

## Database Schema

The system uses Prisma with the following main models:

- **User** - Users with roles (conductor, driver, owner, sacco)
- **Matatu** - Vehicle information
- **Route** - Transportation routes
- **FareRule** - Fare rules per route and fare type
- **Trip** - Trip records
- **Payment** - MPesa payment records
- **RevenueSplit** - Revenue distribution records
- **Alert** - User notifications
- **Idempotency** - Idempotency keys for callbacks

## Security Features

- JWT authentication with expiration
- Role-based access control middleware
- Password hashing with bcrypt
- Rate limiting on API routes
- Helmet.js security headers
- CORS configuration
- Input validation

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Production Deployment

1. Set `NODE_ENV=production` in your `.env`
2. Build the project: `npm run build`
3. Run migrations: `npm run prisma:migrate deploy`
4. Start the server: `npm start`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## License

MIT

