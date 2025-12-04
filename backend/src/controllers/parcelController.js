import pool from '../config/database.js';

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous characters from strings
 * @param {string} str - The input string to sanitize
 * @returns {string} - The sanitized string
 */
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    // Remove < and > to prevent HTML/script injection
    // eslint-disable-next-line no-control-regex
    const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    return str
        .replace(/[<>]/g, '')
        .replace(controlCharsRegex, '')
        .trim();
};

/**
 * Search parcels by parno, address, or owner name
 * GET /api/v1/parcels/search?q=searchTerm&type=parno|address|owner
 */
export async function searchParcels(req, res) {
    try {
        const { q, type = 'all' } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 2 characters',
            });
        }

        const searchTerm = `%${sanitizeInput(q)}%`;

        let query;
        let params;

        switch (type) {
            case 'parno':
                query = `
          SELECT p.parcel_id, p.pin, p.parno, p.physical_address, p.township
          FROM parcels p
          WHERE p.parno ILIKE $1
          ORDER BY p.parno
        `;
                params = [searchTerm];
                break;

            case 'address':
                query = `
          SELECT p.parcel_id, p.pin, p.parno, p.physical_address, p.township
          FROM parcels p
          WHERE p.physical_address ILIKE $1
          ORDER BY p.physical_address
          
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
          
        `;
                params = [searchTerm];
        }

        const result = await pool.query(query, params);

        return res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Search parcels error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to search parcels',
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
      SELECT assessment_id, tax_year, land_value, building_value, total_value
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
      SELECT owner_id, owner_name, is_primary, mailing_address
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

/**
 * Get filter options for advanced search dropdowns
 * GET /api/v1/parcels/filter-options
 */
export async function getFilterOptions(req, res) {
    try {
        // Get distinct townships
        const townshipsQuery = `
            SELECT DISTINCT township
            FROM parcels
            WHERE township IS NOT NULL AND township != ''
            ORDER BY township
        `;
        const townshipsResult = await pool.query(townshipsQuery);

        // Get distinct zoning codes
        const zoningQuery = `
            SELECT DISTINCT zoning_code
            FROM parcels
            WHERE zoning_code IS NOT NULL AND zoning_code != ''
            ORDER BY zoning_code
        `;
        const zoningResult = await pool.query(zoningQuery);

        // Get distinct classifications
        const classificationQuery = `
            SELECT DISTINCT classification
            FROM property_attributes
            WHERE classification IS NOT NULL AND classification != ''
            ORDER BY classification
        `;
        const classificationResult = await pool.query(classificationQuery);

        // Get distinct tax years
        const taxYearsQuery = `
            SELECT DISTINCT tax_year
            FROM assessments
            WHERE tax_year IS NOT NULL
            ORDER BY tax_year DESC
        `;
        const taxYearsResult = await pool.query(taxYearsQuery);

        return res.json({
            success: true,
            data: {
                townships: townshipsResult.rows.map(r => r.township),
                zoning_codes: zoningResult.rows.map(r => r.zoning_code),
                classifications: classificationResult.rows.map(r => r.classification),
                tax_years: taxYearsResult.rows.map(r => r.tax_year),
            },
        });
    } catch (error) {
        console.error('Get filter options error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get filter options',
        });
    }
}

/**
 * Advanced search parcels with multiple filters
 * POST /api/v1/parcels/advanced-search
 */
export async function advancedSearchParcels(req, res) {
    try {
        const {
            parno,
            address,
            owner_name,
            township,
            zoning_code,
            classification,
            deeded_acres_min,
            deeded_acres_max,
            calc_acres_min,
            calc_acres_max,
            gis_acres_min,
            gis_acres_max,
            land_value_min,
            land_value_max,
            building_value_min,
            building_value_max,
            total_value_min,
            total_value_max,
            taxable_value_min,
            taxable_value_max,
            tax_year,
        } = req.body;

        // Build dynamic query with conditions
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        let needsOwnerJoin = false;

        // Parcel number filter (ILIKE for partial match)
        if (parno) {
            conditions.push(`p.parno ILIKE $${paramIndex}`);
            params.push(`%${sanitizeInput(parno)}%`);
            paramIndex++;
        }

        // Address filter (ILIKE for partial match)
        if (address) {
            conditions.push(`p.physical_address ILIKE $${paramIndex}`);
            params.push(`%${sanitizeInput(address)}%`);
            paramIndex++;
        }

        // Owner name filter (ILIKE for partial match)
        if (owner_name) {
            conditions.push(`po.owner_name ILIKE $${paramIndex}`);
            params.push(`%${sanitizeInput(owner_name)}%`);
            paramIndex++;
            needsOwnerJoin = true;
        }

        // Township filter
        if (township) {
            conditions.push(`p.township = $${paramIndex}`);
            params.push(sanitizeInput(township));
            paramIndex++;
        }

        // Zoning code filter
        if (zoning_code) {
            conditions.push(`p.zoning_code = $${paramIndex}`);
            params.push(sanitizeInput(zoning_code));
            paramIndex++;
        }

        // Classification filter
        if (classification) {
            conditions.push(`pa.classification = $${paramIndex}`);
            params.push(sanitizeInput(classification));
            paramIndex++;
        }

        // Deeded acres range
        if (deeded_acres_min !== null && deeded_acres_min !== undefined) {
            conditions.push(`pa.deeded_acres >= $${paramIndex}`);
            params.push(deeded_acres_min);
            paramIndex++;
        }
        if (deeded_acres_max !== null && deeded_acres_max !== undefined) {
            conditions.push(`pa.deeded_acres <= $${paramIndex}`);
            params.push(deeded_acres_max);
            paramIndex++;
        }

        // Calc acres range
        if (calc_acres_min !== null && calc_acres_min !== undefined) {
            conditions.push(`pa.calc_acres >= $${paramIndex}`);
            params.push(calc_acres_min);
            paramIndex++;
        }
        if (calc_acres_max !== null && calc_acres_max !== undefined) {
            conditions.push(`pa.calc_acres <= $${paramIndex}`);
            params.push(calc_acres_max);
            paramIndex++;
        }

        // GIS acres range
        if (gis_acres_min !== null && gis_acres_min !== undefined) {
            conditions.push(`pa.gis_acres >= $${paramIndex}`);
            params.push(gis_acres_min);
            paramIndex++;
        }
        if (gis_acres_max !== null && gis_acres_max !== undefined) {
            conditions.push(`pa.gis_acres <= $${paramIndex}`);
            params.push(gis_acres_max);
            paramIndex++;
        }

        // Tax year filter (for assessment values)
        let taxYearCondition = '';
        if (tax_year) {
            taxYearCondition = `AND a.tax_year = $${paramIndex}`;
            params.push(tax_year);
            paramIndex++;
        }

        // Land value range
        if (land_value_min !== null && land_value_min !== undefined) {
            conditions.push(`a.land_value >= $${paramIndex}`);
            params.push(land_value_min);
            paramIndex++;
        }
        if (land_value_max !== null && land_value_max !== undefined) {
            conditions.push(`a.land_value <= $${paramIndex}`);
            params.push(land_value_max);
            paramIndex++;
        }

        // Building value range
        if (building_value_min !== null && building_value_min !== undefined) {
            conditions.push(`a.building_value >= $${paramIndex}`);
            params.push(building_value_min);
            paramIndex++;
        }
        if (building_value_max !== null && building_value_max !== undefined) {
            conditions.push(`a.building_value <= $${paramIndex}`);
            params.push(building_value_max);
            paramIndex++;
        }

        // Total value range
        if (total_value_min !== null && total_value_min !== undefined) {
            conditions.push(`a.total_value >= $${paramIndex}`);
            params.push(total_value_min);
            paramIndex++;
        }
        if (total_value_max !== null && total_value_max !== undefined) {
            conditions.push(`a.total_value <= $${paramIndex}`);
            params.push(total_value_max);
            paramIndex++;
        }

        // Taxable value range
        if (taxable_value_min !== null && taxable_value_min !== undefined) {
            conditions.push(`a.taxable_value >= $${paramIndex}`);
            params.push(taxable_value_min);
            paramIndex++;
        }
        if (taxable_value_max !== null && taxable_value_max !== undefined) {
            conditions.push(`a.taxable_value <= $${paramIndex}`);
            params.push(taxable_value_max);
            paramIndex++;
        }

        // Check if any filters were provided
        if (conditions.length === 0 && !tax_year) {
            return res.status(400).json({
                success: false,
                error: 'At least one filter must be provided',
            });
        }

        // Build the WHERE clause
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Determine if we need to join assessments table
        const needsAssessments = land_value_min !== null || land_value_max !== null ||
            building_value_min !== null || building_value_max !== null ||
            total_value_min !== null || total_value_max !== null ||
            taxable_value_min !== null || taxable_value_max !== null ||
            tax_year;

        // Build owner join clause if needed
        const ownerJoinClause = needsOwnerJoin
            ? 'LEFT JOIN parcel_owners po ON p.parcel_id = po.parcel_id'
            : '';

        let query;
        if (needsAssessments) {
            // Use subquery to get latest assessment per parcel (or specific tax year)
            query = `
                SELECT DISTINCT
                    p.parcel_id,
                    p.pin,
                    p.parno,
                    p.physical_address,
                    p.township,
                    p.zoning_code,
                    pa.deeded_acres,
                    pa.calc_acres,
                    pa.gis_acres,
                    pa.classification,
                    a.tax_year,
                    a.land_value,
                    a.building_value,
                    a.total_value,
                    a.taxable_value
                FROM parcels p
                LEFT JOIN property_attributes pa ON p.parcel_id = pa.parcel_id
                ${ownerJoinClause}
                LEFT JOIN LATERAL (
                    SELECT * FROM assessments
                    WHERE parcel_id = p.parcel_id ${taxYearCondition}
                    ORDER BY tax_year DESC
                    LIMIT 1
                ) a ON true
                ${whereClause}
                ORDER BY p.parno
                LIMIT 100
            `;
        } else {
            query = `
                SELECT DISTINCT
                    p.parcel_id,
                    p.pin,
                    p.parno,
                    p.physical_address,
                    p.township,
                    p.zoning_code,
                    pa.deeded_acres,
                    pa.calc_acres,
                    pa.gis_acres,
                    pa.classification
                FROM parcels p
                LEFT JOIN property_attributes pa ON p.parcel_id = pa.parcel_id
                ${ownerJoinClause}
                ${whereClause}
                ORDER BY p.parno
                LIMIT 100
            `;
        }

        const result = await pool.query(query, params);

        return res.json({
            success: true,
            count: result.rows.length,
            data: result.rows,
        });
    } catch (error) {
        console.error('Advanced search parcels error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to perform advanced search',
        });
    }
}