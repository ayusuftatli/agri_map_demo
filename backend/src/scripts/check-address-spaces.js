import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Create pool with SSL for Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function checkAddressSpaces() {
    try {
        console.log('Checking for addresses with multiple consecutive spaces...\n');

        // Find addresses with multiple consecutive spaces
        const result = await pool.query(`
            SELECT physical_address, 
                   LENGTH(physical_address) as original_length,
                   LENGTH(REGEXP_REPLACE(physical_address, '\\s+', ' ', 'g')) as normalized_length
            FROM parcels 
            WHERE physical_address ~ '\\s{2,}'
            LIMIT 20
        `);

        console.log('Sample addresses with multiple consecutive spaces:');
        console.log('='.repeat(60));
        result.rows.forEach(row => {
            console.log('Address:', JSON.stringify(row.physical_address));
            console.log('  Original length:', row.original_length, '| Normalized length:', row.normalized_length);
        });

        // Count total affected
        const countResult = await pool.query(`
            SELECT COUNT(*) as count FROM parcels WHERE physical_address ~ '\\s{2,}'
        `);
        console.log('\n' + '='.repeat(60));
        console.log('Total addresses with multiple spaces:', countResult.rows[0].count);

        // Show what the fix would look like
        if (result.rows.length > 0) {
            console.log('\nExample of what the fix would do:');
            console.log('Before:', JSON.stringify(result.rows[0].physical_address));
            const normalized = result.rows[0].physical_address.replace(/\s+/g, ' ').trim();
            console.log('After: ', JSON.stringify(normalized));
        }

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkAddressSpaces();