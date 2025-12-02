import pool from '../config/database.js';

/**
 * Search parcels by parno, address, or owner name
 * GET /api/v1/parcels/search?q=searchTerm&type=parno|address|owner
 */
export async function searchParcels(req, res) {
    try {
        const { q, type = 'all' } = req.query;

        // DEBUG: Log incoming request
        console.log('=== SEARCH DEBUG ===');
        console.log('Query params:', { q, type });

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 2 characters',
            });
        }

        const searchTerm = `%${q.trim()}%`;
        console.log('Search term:', searchTerm);

        let query;
        let params;

        switch (type) {
            case 'parno':
                query = `
          SELECT p.parcel_id, p.pin, p.parno, p.physical_address, p.township
          FROM parcels p
          WHERE p.parno ILIKE $1
          ORDER BY p.parno
          LIMIT 50
        `;
                params = [searchTerm];
                break;

            case 'address':
                query = `
          SELECT p.parcel_id, p.pin, p.parno, p.physical_address, p.township
          FROM parcels p
          WHERE p.physical_address ILIKE $1
          ORDER BY p.physical_address
          LIMIT 50
        `;
                params = [searchTerm];
                break;

            case 'owner':
                query = `
          SELECT DISTINCT p.parcel_id, p.pin, p.parno, p.physical_address, p.township, po.owner_name
          FROM parcels p
          JOIN parcel_owners po ON p.parcel_id = po.parcel_id
          WHERE po.owner_name ILIKE $1
          ORDER BY p.parno
          LIMIT 50
        `;
                params = [searchTerm];
                break;

            default:
                // Search all fields
                query = `
          SELECT DISTINCT p.parcel_id, p.pin, p.parno, p.physical_address, p.township
          FROM parcels p
          LEFT JOIN parcel_owners po ON p.parcel_id = po.parcel_id
          WHERE p.parno ILIKE $1
             OR p.physical_address ILIKE $1
             OR po.owner_name ILIKE $1
          ORDER BY p.parno
          LIMIT 50
        `;
                params = [searchTerm];
        }

        // DEBUG: Log the query being executed
        console.log('Executing query:', query);
        console.log('With params:', params);

        const result = await pool.query(query, params);

        // DEBUG: Log result count
        console.log('Query returned', result.rows.length, 'rows');

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        // DEBUG: Log full error details
        console.error('=== SEARCH ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error detail:', error.detail);
        console.error('Full error:', error);

        return res.status(500).json({
            success: false,
            error: 'Failed to search parcels',
            // Include error details in development mode
            debug: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                detail: error.detail
            } : undefined
        });
    }
}

/**
 * Get full parcel details including attributes, latest assessment, and owners
 * GET /api/v1/parcels/:parcelId
 */
export async function getParcelDetails(req, res) {
    try {
        const { parcelId } = req.params;

        // Get parcel basic info
        const parcelQuery = `
      SELECT p.*, pa.gis_acres, pa.calc_acres, pa.classification, pa.road_type, pa.utilities
      FROM parcels p
      LEFT JOIN property_attributes pa ON p.parcel_id = pa.parcel_id
      WHERE p.parcel_id = $1
    `;
        const parcelResult = await pool.query(parcelQuery, [parcelId]);

        if (parcelResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found',
            });
        }

        // Get latest assessment
        const assessmentQuery = `
      SELECT tax_year, land_value, building_value, total_value
      FROM assessments
      WHERE parcel_id = $1
      ORDER BY tax_year DESC
      LIMIT 1
    `;
        const assessmentResult = await pool.query(assessmentQuery, [parcelId]);

        // Get owners
        const ownersQuery = `
      SELECT owner_name, is_primary, mailing_address
      FROM parcel_owners
      WHERE parcel_id = $1
      ORDER BY is_primary DESC
    `;
        const ownersResult = await pool.query(ownersQuery, [parcelId]);

        const parcel = parcelResult.rows[0];

        return res.json({
            success: true,
            data: {
                parcel_id: parcel.parcel_id,
                pin: parcel.pin,
                parno: parcel.parno,
                physical_address: parcel.physical_address,
                township: parcel.township,
                legal_desc: parcel.legal_desc,
                zoning_code: parcel.zoning_code,
                attributes: {
                    gis_acres: parcel.gis_acres,
                    calc_acres: parcel.calc_acres,
                    classification: parcel.classification,
                    road_type: parcel.road_type,
                    utilities: parcel.utilities,
                },
                latest_assessment: assessmentResult.rows[0] || null,
                owners: ownersResult.rows,
            },
        });
    } catch (error) {
        console.error('Get parcel details error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get parcel details',
        });
    }
}

/**
 * Get assessment history for a parcel
 * GET /api/v1/parcels/:parcelId/assessments
 */
export async function getAssessments(req, res) {
    try {
        const { parcelId } = req.params;

        // Verify parcel exists
        const parcelCheck = await pool.query(
            'SELECT parcel_id FROM parcels WHERE parcel_id = $1',
            [parcelId]
        );

        if (parcelCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found',
            });
        }

        const query = `
      SELECT assessment_id, tax_year, land_value, building_value, total_value, created_at
      FROM assessments
      WHERE parcel_id = $1
      ORDER BY tax_year DESC
    `;
        const result = await pool.query(query, [parcelId]);

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get assessments error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get assessments',
        });
    }
}

/**
 * Get owner records for a parcel
 * GET /api/v1/parcels/:parcelId/owners
 */
export async function getOwners(req, res) {
    try {
        const { parcelId } = req.params;

        // Verify parcel exists
        const parcelCheck = await pool.query(
            'SELECT parcel_id FROM parcels WHERE parcel_id = $1',
            [parcelId]
        );

        if (parcelCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found',
            });
        }

        const query = `
      SELECT owner_id, owner_name, is_primary, mailing_address, created_at
      FROM parcel_owners
      WHERE parcel_id = $1
      ORDER BY is_primary DESC, owner_name
    `;
        const result = await pool.query(query, [parcelId]);

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get owners error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get owners',
        });
    }
}