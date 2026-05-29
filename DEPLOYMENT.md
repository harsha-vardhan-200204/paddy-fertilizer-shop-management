# Production Deployment Guide

This project is deployed as two services:

- Frontend: Vercel static Vite app
- Backend: Render or Railway Node/Express API

## Required Environment Variables

### Vercel frontend

Set this in Vercel Project Settings > Environment Variables:

```env
VITE_API_URL=https://your-render-or-railway-backend-url
```

Do not include a trailing slash.

### Render or Railway backend

Set these variables on the backend service:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-vercel-frontend-url
CORS_ORIGIN=https://your-vercel-frontend-url
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=use-a-long-random-secret
```

## GitHub Push

```bash
git add .
git commit -m "Configure production frontend and backend deployment"
git push origin main
```

## Render Backend Deploy

1. Create a new Render Web Service from the GitHub repo.
2. Root directory: project folder containing `package.json`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the backend environment variables listed above.
6. Deploy.
7. Open `https://your-backend.onrender.com/api/health`.

Expected result:

```json
{
  "ok": true
}
```

## Railway Backend Deploy

1. Create a new Railway project from the GitHub repo.
2. Set the service root to the project folder containing `package.json`.
3. Railway should use `npm start`.
4. Add the backend environment variables listed above.
5. Deploy.
6. Open `https://your-railway-domain.up.railway.app/api/health`.

## Vercel Frontend Deploy

1. Import the GitHub repo in Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add `VITE_API_URL` with the deployed backend URL.
6. Deploy.

## Login Test

After database seeding, use:

```text
Username: admin
Password: admin123
```

If login fails:

1. Visit backend `/api/health`.
2. Confirm Vercel has `VITE_API_URL`.
3. Confirm backend has `CLIENT_URL` and `CORS_ORIGIN` set to the Vercel URL.
4. Confirm backend has `DATABASE_URL` and the database has seeded users.
