# Frontend Setup Guide

## Current State

Your repository has:
- ✅ **TypeScript/React frontend** - Running on port 5000 (existing Disaster Direct app)
- ✅ **Python FastAPI backend** - In `backend/` directory (port 8000)
- 📦 **Next.js frontend** - In uploaded ZIP (needs extraction)

---

## Option 1: Extract Your Next.js Frontend from ZIP

### Step 1: Extract the ZIP File
```bash
# The ZIP is at:
# attached_assets/storm-disaster-monorepo_1762094022591.zip

# You'll need to:
1. Download the ZIP file from attached_assets/
2. Extract it locally or on Replit
3. Copy the 'frontend' directory to the project root
```

### Step 2: Install Dependencies
```bash
cd frontend
npm install
```

### Step 3: Run Next.js Dev Server
```bash
npm run dev
# Opens on http://localhost:3000
```

---

## Option 2: Use Existing React Frontend (Already Running!)

Your current **TypeScript/React frontend** is already running:
- **Location**: `client/` directory
- **Port**: 5000 (accessible now!)
- **Tech**: React 18 + Vite + Shadcn/ui
- **Features**: 30+ pages including ContractorPortal and VictimDashboard

### Access it now:
```
https://your-repl.repl.co
```

### Pages available:
- `/contractor-portal` - Contractor dashboard
- `/victim-dashboard` - Homeowner portal
- `/claims` - Claims management
- `/leads` - Lead generation
- And 25+ more pages!

---

## Option 3: Create New Next.js Frontend (Fresh Start)

If you want a brand new Next.js app:

```bash
# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

---

## Recommended Approach

**Use your existing React frontend** (client/) because:
1. ✅ It's already running and accessible
2. ✅ Has 30+ pages built
3. ✅ Connected to your backend
4. ✅ Has all your components and modules
5. ✅ No setup needed - works now!

**Extract the Next.js ZIP** if you want to:
- Run both frontends side-by-side
- Migrate from React to Next.js
- Have separate contractor/homeowner apps

---

## Next Steps

1. **Try your existing frontend**: Open your Replit webview (it's live!)
2. **Extract ZIP** (if needed): Let me know and I can help
3. **Connect to Python backend**: I can wire the frontend to your FastAPI API

What would you like to do?
