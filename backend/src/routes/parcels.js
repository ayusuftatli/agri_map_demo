import express from 'express';
import {
    searchParcels,
    getParcelDetails,
    getAssessments,
    getOwners,
    getFilterOptions,
    advancedSearchParcels,
} from '../controllers/parcelController.js';

const router = express.Router();

// GET /api/v1/parcels/search - Search parcels by query
// Query params: q (search term), type (parno|address|owner)
router.get('/parcels/search', searchParcels);

// GET /api/v1/parcels/filter-options - Get filter options for advanced search
router.get('/parcels/filter-options', getFilterOptions);

// POST /api/v1/parcels/advanced-search - Advanced search with multiple filters
router.post('/parcels/advanced-search', advancedSearchParcels);

// GET /api/v1/parcels/:parcelId - Get full parcel details
router.get('/parcels/:parcelId', getParcelDetails);

// GET /api/v1/parcels/:parcelId/assessments - Get assessment history
router.get('/parcels/:parcelId/assessments', getAssessments);

// GET /api/v1/parcels/:parcelId/owners - Get ownership records
router.get('/parcels/:parcelId/owners', getOwners);

export default router;