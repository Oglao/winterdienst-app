// Test Assignment System with PostGIS Integration
const Assignment = require('./models/Assignment');

async function testAssignmentSystem() {
  console.log('🧪 Testing Assignment System with PostGIS...\n');

  try {
    // Test 1: Get resource availability
    console.log('1. Getting resource availability...');
    const availability = await Assignment.getResourceAvailability();
    
    console.log(`✅ Resource availability:
   - Available vehicles: ${availability.resource_summary.vehicles_available}
   - Available workers: ${availability.resource_summary.workers_available}
   - Unassigned routes: ${availability.resource_summary.routes_needing_assignment}
   - Can fulfill all: ${availability.resource_summary.can_fulfill_all ? 'Yes' : 'No'}
`);

    // Test 2: Generate optimal assignments
    console.log('2. Generating optimal assignments...');
    const optimalAssignments = await Assignment.generateOptimalAssignments();
    
    console.log(`✅ Generated ${optimalAssignments.assignments.length} optimal assignments`);
    optimalAssignments.assignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. Route: ${assignment.route_name} (${assignment.route_priority})`);
      if (assignment.vehicle_info) {
        console.log(`      Vehicle: ${assignment.vehicle_info.license_plate} (${assignment.vehicle_info.brand})`);
      }
      if (assignment.worker_info) {
        console.log(`      Worker: ${assignment.worker_info.name}`);
      }
      if (assignment.conflicts.length > 0) {
        console.log(`      Conflicts: ${assignment.conflicts.join(', ')}`);
      }
    });

    if (optimalAssignments.conflicts.length > 0) {
      console.log('\n⚠️  System conflicts detected:');
      optimalAssignments.conflicts.forEach(conflict => {
        console.log(`   - ${conflict.message || conflict.route}: ${conflict.issues?.join(', ') || conflict.type}`);
      });
    }

    // Test 3: Create actual assignments
    console.log('\n3. Creating test assignments...');
    const assignmentsToCreate = optimalAssignments.assignments
      .filter(a => a.vehicle_id && a.worker_id)
      .slice(0, 2) // Take first 2 feasible assignments
      .map(a => ({
        route_id: a.route_id,
        worker_id: a.worker_id,
        vehicle_id: a.vehicle_id,
        scheduled_start: new Date(),
        notes: 'Test assignment created via PostGIS integration test'
      }));

    if (assignmentsToCreate.length > 0) {
      const bulkResult = await Assignment.createBulkAssignments(assignmentsToCreate);
      console.log(`✅ Created ${bulkResult.success.length} assignments successfully`);
      
      if (bulkResult.errors.length > 0) {
        console.log(`⚠️  ${bulkResult.errors.length} assignment(s) failed:`);
        bulkResult.errors.forEach(error => {
          console.log(`   - ${error.error}`);
        });
      }
    } else {
      console.log('⚠️  No feasible assignments to create');
    }

    // Test 4: Get assignment stats
    console.log('\n4. Getting assignment statistics...');
    const stats = await Assignment.getAssignmentStats();
    console.log(`✅ Assignment statistics:
   - Total assignments: ${stats.total_assignments}
   - Active assignments: ${stats.active_assignments}
   - Completed assignments: ${stats.completed_assignments}
   - Success rate: ${parseFloat(stats.success_rate).toFixed(1)}%
`);

    console.log('🎉 Assignment system test completed successfully!');

  } catch (error) {
    console.error('❌ Assignment test failed:', error.message);
  }
}

testAssignmentSystem().catch(console.error);