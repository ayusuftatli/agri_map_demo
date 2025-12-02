import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Create pool with SSL for Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function fixAddressSpaces() {
    try {
        console.log('='.repeat(60));
        console.log('ADDRESS SPACING FIX MIGRATION');
        console.log('='.repeat(60));

        // Count affected rows before fix
        const beforeCount = await pool.query(`
            SELECT COUNT(*) as count FROM parcels WHERE physical_address ~ '\\s{2,}'
        `);
        console.log('\nAddresses with multiple spaces before fix:', beforeCount.rows[0].count);

        if (beforeCount.rows[0].count === '0') {
            console.log('No addresses need fixing. Exiting.');
            return;
        }

        // Show a sample before fixing
        const sampleBefore = await pool.query(`
            SELECT physical_address FROM parcels 
            WHERE physical_address ~ '\\s{2,}'
            LIMIT 5
        `);
        console.log('\nSample addresses before fix:');
        sampleBefore.rows.forEach(row => {
            console.log('  ', JSON.stringify(row.physical_address));
        });

        // Apply the fix: normalize multiple spaces to single space and trim
        console.log('\nApplying fix...');
        const updateResult = await pool.query(`
            UPDATE parcels 
            SET physical_address = TRIM(REGEXP_REPLACE(physical_address, '\\s+', ' ', 'g'))
            WHERE physical_address ~ '\\s{2,}'
        `);
        console.log('Rows updated:', updateResult.rowCount);

        // Verify the fix
        const afterCount = await pool.query(`
            SELECT COUNT(*) as count FROM parcels WHERE physical_address ~ '\\s{2,}'
        `);
        console.log('\nAddresses with multiple spaces after fix:', afterCount.rows[0].count);

        // Show the same addresses after fixing (by looking at similar patterns)
        const sampleAfter = await pool.query(`
            SELECT physical_address FROM parcels 
            WHERE physical_address LIKE '%IRA B TART%' OR physical_address LIKE '%JADA ALLEN%'
            LIMIT 5
        `);
        console.log('\nSample addresses after fix:');
        sampleAfter.rows.forEach(row => {
            console.log('  ', JSON.stringify(row.physical_address));
        });

        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION COMPLETE');
        console.log('='.repeat(60));

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixAddressSpaces();