# Parcel Information System - Architecture Plan

## Overview
KEEP IT SIMPLE AND TO THE POINT
Transform the existing map-only application into a full parcel information system with a Node.js/Express backend connected to the PostgreSQL database on Railway.

## System Architecture

```mermaid
graph TB
    subgraph Frontend - React/Vite
        UI[User Interface]
        Map[Mapbox Map Component]
        Search[Search Component]
        Detail[Parcel Detail Panel]
    end
    
    subgraph Backend - Node.js/Express
        API[Express API Server]
        Routes[API Routes]
        DB[PostgreSQL Client - pg]
    end
    
    subgraph Database - Railway PostgreSQL
        Parcels[(Parcels)]
        Attrs[(Property_Attributes)]
        Assess[(Assessments)]
        Owners[(Parcel_Owners)]
    end
    
    UI --> Search
    UI --> Map
    UI --> Detail
    Search --> API
    Map --> API
    API --> Routes
    Routes --> DB
    DB --> Parcels
    DB --> Attrs
    DB --> Assess
    DB --> Owners
```

## Project Structure

```
agri_map/
├── backend/                    # New Express.js backend
│   ├── src/
│   │   ├── index.js           # Entry point
│   │   ├── config/
│   │   │   └── database.js    # PostgreSQL connection pool
│   │   ├── routes/
│   │   │   └── parcels.js     # Parcel API routes
│   │   └── controllers/
│   │       └── parcelController.js  # Business logic
│   ├── package.json
│   └── .env                   # Backend environment variables
├── src/                       # Existing React frontend
│   ├── components/
│   │   ├── Map.jsx           # Updated map component
│   │   ├── ParcelDetail.jsx  # New detail panel component
│   │   └── SearchBar.jsx     # Enhanced search component
│   ├── services/
│   │   └── api.js            # API client for backend calls
│   └── App.jsx               # Updated main app
├── .env                      # Frontend environment variables
└── package.json              # Frontend dependencies
```

## API Endpoints

### Base URL: `/api/v1`

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/parcels/search` | Search parcels | `q` - search term, `type` - parno/address/owner |
| GET | `/parcels/:parcelId` | Get full parcel details | - |
| GET | `/parcels/:parcelId/assessments` | Get assessment history | `year` - optional filter |
| GET | `/parcels/:parcelId/owners` | Get ownership records | - |

### Example Responses

#### GET `/api/v1/parcels/search?q=123&type=parno`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "parcel_id": "12345",
      "parno": "123-456-789",
      "physical_address": "123 Main St",
      "township": "Sampson",
      "gis_acres": 10.5
    }
  ]
}
```

#### GET `/api/v1/parcels/:parcelId`
```json
{
  "success": true,
  "data": {
    "parcel": {
      "parcel_id": "12345",
      "pin": "123456789",
      "parno": "123-456-789",
      "physical_address": "123 Main St",
      "township": "Sampson",
      "legal_desc": "...",
      "zoning_code": "R-1"
    },
    "attributes": {
      "gis_acres": 10.5,
      "calc_acres": 10.3,
      "classification": "Residential",
      "road_type": "Paved",
      "utilities": "Public Water"
    },
    "latestAssessment": {
      "tax_year": 2024,
      "land_value": 50000,
      "building_value": 150000,
      "total_value": 200000
    },
    "owners": [
      {
        "owner_name": "John Doe",
        "is_primary": true,
        "mailing_address": "123 Main St, Clinton, NC"
      }
    ]
  }
}
```

## Database Connection

Using `pg` (node-postgres) with connection pooling:

```javascript
// backend/src/config/database.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

## Frontend Changes

### New Components

1. **ParcelDetail.jsx** - Slide-out panel showing full parcel information
   - Parcel basic info section
   - Property attributes section
   - Assessment/tax info section
   - Owner information section

2. **SearchBar.jsx** - Enhanced search with type selection
   - Search by parcel number
   - Search by address
   - Search by owner name
   - Autocomplete suggestions

### Updated Components

1. **Map.jsx** - Add click handler to show parcel details
2. **App.jsx** - Add state management for selected parcel and detail panel

### API Service

```javascript
// src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const searchParcels = async (query, type = 'parno') => {
  const response = await fetch(`${API_BASE}/parcels/search?q=${query}&type=${type}`);
  return response.json();
};

export const getParcelDetails = async (parcelId) => {
  const response = await fetch(`${API_BASE}/parcels/${parcelId}`);
  return response.json();
};
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:...@yamabiko.proxy.rlwy.net:38203/railway
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api/v1
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

## Railway Deployment

### Backend Service
- Create new service in Railway project
- Connect to GitHub repo (backend folder)
- Set environment variables
- Railway will auto-detect Node.js and deploy

### Frontend Service
- Can remain on Vite dev server locally
- Or deploy to Railway/Vercel/Netlify
- Update VITE_API_URL to production backend URL

## Implementation Order

1. **Backend Setup** 
   - Initialize Express project in `/backend`
   - Set up PostgreSQL connection
   - Create basic health check endpoint
   - Test database connectivity

2. **API Development**
   - Implement search endpoint
   - Implement parcel detail endpoint
   - Add error handling and validation

3. **Frontend Integration** 
   - Create API service layer
   - Build ParcelDetail component
   - Update Map component with click handlers
   - Connect search to backend API

4. **Polish & Deploy**
   - Add loading states and error handling
   - Configure CORS for production
   - Deploy backend to Railway
   - Test end-to-end

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Mapbox GL |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Railway) |
| ORM/Query | pg (node-postgres) - raw SQL |
| Deployment | Railway |

## Future Enhancements

- [ ] Add filtering by township, zoning, value range
- [ ] Implement sorting options
- [ ] Add CSV/PDF export functionality
- [ ] Add authentication for sensitive data
- [ ] Implement caching layer (Redis)
- [ ] Add spatial queries for nearby parcels