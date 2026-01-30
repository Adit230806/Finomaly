# Finomaly Deployment Guide

## Firebase Configuration Error Fix

### Problem
`Firebase: Error (auth/invalid-api-key)` after deployment

### Solution

#### For Local Development
1. Ensure `.env` file exists in root directory
2. Contains all Firebase credentials
3. Restart React dev server: `npm start`

#### For Production Deployment

**Option 1: Vercel/Netlify**
1. Go to project settings
2. Add environment variables:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
3. Redeploy

**Option 2: Docker**
```dockerfile
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Option 3: Manual Server**
1. Copy `.env` to server
2. Run: `npm install && npm run build`
3. Serve build folder

## Environment Variables Required

```
REACT_APP_FIREBASE_API_KEY=AIzaSyDdxswQqIyOEBFweYCU9ceEKLlAN8GNU9U
REACT_APP_FIREBASE_AUTH_DOMAIN=finomaly-6fdfd.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=finomaly-6fdfd
REACT_APP_FIREBASE_STORAGE_BUCKET=finomaly-6fdfd.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=287957063192
REACT_APP_FIREBASE_APP_ID=1:287957063192:web:56cf767a1189014ecb556d
```

## API Server Deployment

```bash
cd ml_api
pip install -r requirements.txt
python app.py
```

Or with Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Verification

1. Check Firebase loads: Open browser console
2. No "invalid-api-key" error
3. Test API: `curl http://localhost:5000/health`
4. Test batch endpoint: `curl -X POST http://localhost:5000/api/analyze-batch`