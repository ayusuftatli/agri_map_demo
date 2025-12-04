# Railway Deployment Guide

This project is configured for deployment on Railway as two separate services.

## Architecture

- **Frontend**: React + Vite static site
- **Backend**: Express.js API server
- **Database**: PostgreSQL (already provisioned on Railway)

## Deployment Steps

### 1. Create a New Railway Project

1. Go to [Railway](https://railway.app) and create a new project
2. Connect your GitHub repository

### 2. Deploy the Backend Service

1. In your Railway project, click "New Service" → "GitHub Repo"
2. Select your repository
3. **Important**: Set the root directory to `backend`
4. Add the following environment variables:
   - `DATABASE_URL` - Link to your PostgreSQL service (Railway does this automatically if you add PostgreSQL)
   - `NODE_ENV` - Set to `production`
   - `CORS_ORIGIN` - Will be set after frontend deployment (e.g., `https://your-frontend.up.railway.app`)

5. The service will auto-deploy using the `backend/railway.json` configuration

### 3. Deploy the Frontend Service

1. In your Railway project, click "New Service" → "GitHub Repo"
2. Select the same repository
3. **Important**: Keep the root directory as `/` (root)
4. Add the following environment variables:
   - `VITE_API_URL` - Your backend URL (e.g., `https://your-backend.up.railway.app/api/v1`)
   - `VITE_MAPBOX_PUBLIC_KEY` - Your Mapbox public access token

5. The service will auto-deploy using the root `railway.json` configuration

### 4. Update CORS Settings

After both services are deployed:
1. Copy the frontend URL from Railway
2. Go to your backend service settings
3. Update `CORS_ORIGIN` to include your frontend URL

## Environment Variables Summary

### Backend (`backend/`)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `PORT` | Server port (auto-set by Railway) | `3001` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGIN` | Allowed frontend origins | `https://frontend.up.railway.app` |

### Frontend (root)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.up.railway.app/api/v1` |
| `VITE_MAPBOX_PUBLIC_KEY` | Mapbox public token | `pk.eyJ1...` |

## Health Check

The backend includes a health check endpoint at `/health` that Railway uses to verify the service is running.

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in the backend matches your frontend URL exactly
- Multiple origins can be comma-separated: `https://app1.railway.app,https://app2.railway.app`

### Build Failures
- Check that all dependencies are in `dependencies` (not `devDependencies`) for production builds
- Verify Node.js version compatibility (requires Node 18+)

### Database Connection Issues
- Ensure `DATABASE_URL` is properly linked to your PostgreSQL service
- Check that the database has the required tables (see `database_schema.md`)