# Quick Start Guide

## Fixed Issues

✅ **Backend Error Fixed**: The Africa's Talking service now uses lazy initialization, so it won't crash on startup if keys are missing. It will only error when you actually try to use the payment feature.

## Starting the Application

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The backend should now start without errors. You'll see:
```
Server is running on port 4000
```

**Note**: If you see a warning about AT keys, that's fine - the server will still run. You just won't be able to use payment features until you add the keys.

### 2. Start Frontend Server

Open a **new terminal window** and run:

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### 3. Access the Website

Open your browser and go to:
```
http://localhost:8080
```

## Troubleshooting

### Backend won't start
- Make sure port 4000 is not already in use
- Check that all dependencies are installed: `cd backend && npm install`

### Frontend won't start
- Make sure port 8080 is not already in use
- Check that all dependencies are installed: `cd frontend && npm install`
- If you see "chart.js" or "react-chartjs-2" errors, run: `npm install chart.js react-chartjs-2`

### Can't see the website
1. **Check both servers are running**:
   - Backend on port 4000
   - Frontend on port 8080

2. **Check the browser console** (F12) for errors

3. **Verify the frontend is actually running**:
   - Look for the Vite dev server output showing `http://localhost:8080`
   - Try accessing `http://localhost:8080` directly

4. **Check CORS** (if API calls fail):
   - Backend should have CORS enabled (it does in app.ts)
   - Frontend API is configured to use `http://localhost:4000/api`

### Payment Features (Optional - for later)

To enable payment features, add to `backend/.env`:
```env
AT_USERNAME=sandbox
AT_API_KEY=SK_YOUR_SANDBOX_KEY
PUBLIC_BASE_URL=https://<your-ngrok>.ngrok-free.app
```

Then restart the backend server.

## Common Commands

```bash
# Backend
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npx prisma generate  # Generate Prisma client
npx prisma migrate dev --name migration_name  # Run migrations

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
```

