// PostGIS Integration Test
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'winterdienst_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

async function testPostGISIntegration() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing PostGIS Integration...\n');

    // Test 1: Check if PostGIS extension is installed
    console.log('1. Checking PostGIS extension...');
    const extensionResult = await client.query(`
      SELECT name, default_version, installed_version 
      FROM pg_available_extensions 
      WHERE name = 'postgis'
    `);
    
    if (extensionResult.rows.length > 0) {
      const ext = extensionResult.rows[0];
      console.log(`✅ PostGIS found: v${ext.installed_version || 'not installed'}`);
    } else {
      console.log('❌ PostGIS extension not found');
      return;
    }

    // Test 2: Check enhanced geolocation functions
    console.log('\n2. Testing enhanced geolocation functions...');
    
    const functionsResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN (
        'find_nearby_workers', 
        'get_route_length', 
        'point_near_route',
        'calculate_coverage_area'
      )
    `);
    
    console.log(`✅ Found ${functionsResult.rows.length}/4 enhanced functions:`);
    functionsResult.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

    // Test 3: Check geometry columns
    console.log('\n3. Checking geometry columns...');
    
    const geometryResult = await client.query(`
      SELECT f_table_name, f_geometry_column, type 
      FROM geometry_columns
      WHERE f_table_schema = 'public'
    `);
    
    console.log(`✅ Found ${geometryResult.rows.length} geometry columns:`);
    geometryResult.rows.forEach(row => {
      console.log(`   - ${row.f_table_name}.${row.f_geometry_column} (${row.type})`);
    });

    // Test 4: Test spatial functions with sample data
    console.log('\n4. Testing spatial calculations...');
    
    // Test find_nearby_workers function
    const nearbyTest = await client.query(`
      SELECT worker_id, worker_name, distance_meters 
      FROM find_nearby_workers(53.5511, 9.9937, 10000)
      LIMIT 3
    `);
    
    console.log(`✅ Nearby workers test: Found ${nearbyTest.rows.length} workers`);
    nearbyTest.rows.forEach(row => {
      console.log(`   - ${row.worker_name}: ${row.distance_meters}m away`);
    });

    // Test 5: Check enhanced views
    console.log('\n5. Testing enhanced views...');
    
    const viewsResult = await client.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname LIKE '%geography%'
    `);
    
    console.log(`✅ Enhanced geography views: ${viewsResult.rows.length} found`);
    viewsResult.rows.forEach(row => {
      console.log(`   - ${row.viewname}`);
    });

    // Test 6: Sample route length calculation
    const routeTest = await client.query(`
      SELECT id, name, get_route_length(id) as length_meters
      FROM routes 
      WHERE route_geometry IS NOT NULL
      LIMIT 3
    `);
    
    console.log(`\n6. Route length calculations:`);
    if (routeTest.rows.length > 0) {
      routeTest.rows.forEach(row => {
        console.log(`   - ${row.name}: ${row.length_meters}m`);
      });
    } else {
      console.log('   No routes with geometry data found');
    }

    console.log('\n🎉 PostGIS integration test completed successfully!');

  } catch (error) {
    console.error('❌ PostGIS test failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testPostGISIntegration().catch(console.error);