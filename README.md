# Agricultural Parcel Information System

Full-stack web application for searching, visualizing, and managing property parcel data.

## Tech Stack

**Frontend**
- React 19.2
- Vite 7.2
- Mapbox GL 3.16
- Modern CSS

**Backend**
- Node.js 20+
- Express.js 4.18
- PostgreSQL
- RESTful API

## Features

- Interactive map visualization with Mapbox GL
- Parcel search by ID, PIN, address, owner
- Advanced filtering (acreage, value, zoning)
- Detailed property information display
- GeoJSON data rendering with 100k+ parcels
- Rate-limited API endpoints

## Database Schema

Normalized PostgreSQL schema with 4 core tables:
- **Parcels**: Core parcel records with identifiers and legal descriptions
- **Property_Attributes**: Physical attributes, acreage, zoning
- **Assessments**: Tax year valuations and assessments
- **Parcel_Owners**: Ownership records with mailing addresses

See [`database_schema.md`](database_schema.md) for full details.

## Installation

**Frontend**
```bash
npm install
npm run dev
```

**Backend**
```bash
cd backend
npm install
npm run dev
```

## Environment Variables

Backend requires:
```
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
```

## Project Structure

```
├── src/
│   ├── components/     # React components (Map, SearchBar, ParcelDetail)
│   ├── services/       # API client
│   └── utils/          # Map debugging utilities
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── config/
└── public/             # GeoJSON parcel data
```

## Live Demo

Deployed on Railway with PostgreSQL instance.
