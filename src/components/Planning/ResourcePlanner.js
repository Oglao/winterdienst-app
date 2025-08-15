import React, { useState, useEffect } from 'react';
import { Users, Car, MapPin, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ResourcePlanner = () => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResourceData();
  }, []);

  const loadResourceData = async () => {
    try {
      setLoading(true);
      
      // Load routes, vehicles, and workers
      const [routesRes, vehiclesRes, workersRes] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/vehicles'),
        fetch('/api/users')
      ]);

      if (routesRes.ok && vehiclesRes.ok && workersRes.ok) {
        const routesData = await routesRes.json();
        const vehiclesData = await vehiclesRes.json();
        const workersData = await workersRes.json();

        setRoutes(routesData);
        setVehicles(vehiclesData);
        setWorkers(workersData.filter(w => w.role === 'worker'));
        
        // Generate initial assignments
        generateOptimalAssignments(routesData, vehiclesData, workersData);
      }
    } catch (error) {
      console.error('Error loading resource data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptimalAssignments = (routes, vehicles, workers) => {
    const availableVehicles = vehicles.filter(v => v.is_active && !v.assigned_user_id);
    const availableWorkers = workers.filter(w => w.is_active);
    const activeRoutes = routes.filter(r => r.status !== 'abgeschlossen');

    const newAssignments = [];
    const newConflicts = [];

    // Calculate required resources
    const totalRoutes = activeRoutes.length;
    const availableVehicleCount = availableVehicles.length;
    const availableWorkerCount = availableWorkers.length;

    // Check for resource conflicts
    if (totalRoutes > availableVehicleCount) {
      newConflicts.push({
        type: 'vehicle_shortage',
        message: `Fahrzeug-Mangel: ${totalRoutes} Routen benötigen ${totalRoutes} Fahrzeuge, aber nur ${availableVehicleCount} verfügbar`,
        severity: 'high'
      });
    }

    if (totalRoutes > availableWorkerCount) {
      newConflicts.push({
        type: 'worker_shortage',
        message: `Mitarbeiter-Mangel: ${totalRoutes} Routen benötigen ${totalRoutes} Mitarbeiter, aber nur ${availableWorkerCount} verfügbar`,
        severity: 'high'
      });
    }

    // Optimal assignment algorithm
    let vehicleIndex = 0;
    let workerIndex = 0;

    activeRoutes.forEach((route, index) => {
      const assignment = {
        id: `assignment_${index}`,
        route_id: route.id,
        route_name: route.name,
        route_priority: route.priority,
        vehicle_id: null,
        vehicle_info: null,
        worker_id: null,
        worker_info: null,
        status: 'pending',
        conflicts: []
      };

      // Assign vehicle if available
      if (vehicleIndex < availableVehicles.length) {
        const vehicle = availableVehicles[vehicleIndex];
        assignment.vehicle_id = vehicle.id;
        assignment.vehicle_info = {
          license_plate: vehicle.license_plate,
          brand: vehicle.brand,
          model: vehicle.model,
          fuel_percentage: vehicle.fuel_percentage,
          maintenance_alerts: []
        };
        vehicleIndex++;
      } else {
        assignment.conflicts.push('Kein Fahrzeug verfügbar');
      }

      // Assign worker if available
      if (workerIndex < availableWorkers.length) {
        const worker = availableWorkers[workerIndex];
        assignment.worker_id = worker.id;
        assignment.worker_info = {
          name: worker.name,
          email: worker.email,
          current_status: 'verfügbar'
        };
        workerIndex++;
      } else {
        assignment.conflicts.push('Kein Mitarbeiter verfügbar');
      }

      // Determine assignment status
      if (assignment.vehicle_id && assignment.worker_id) {
        assignment.status = 'ready';
      } else if (assignment.conflicts.length > 0) {
        assignment.status = 'conflict';
      }

      newAssignments.push(assignment);
    });

    setAssignments(newAssignments);
    setConflicts(newConflicts);
  };

  const saveAssignments = async () => {
    try {
      // Update routes with assignments
      const updates = assignments
        .filter(a => a.status === 'ready')
        .map(assignment => ({
          route_id: assignment.route_id,
          assigned_worker_id: assignment.worker_id,
          assigned_vehicle_id: assignment.vehicle_id
        }));

      for (const update of updates) {
        await fetch(`/api/routes/${update.route_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assigned_worker_id: update.assigned_worker_id
          })
        });

        // Update vehicle assignment
        await fetch(`/api/vehicles/${update.assigned_vehicle_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assigned_user_id: update.assigned_worker_id
          })
        });
      }

      alert('Zuweisungen erfolgreich gespeichert!');
      loadResourceData();
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Fehler beim Speichern der Zuweisungen');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'conflict':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'hoch':
        return 'bg-red-100 text-red-800';
      case 'mittel':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const readyAssignments = assignments.filter(a => a.status === 'ready').length;
  const conflictAssignments = assignments.filter(a => a.status === 'conflict').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ressourcen-Planung</h1>
          <p className="text-gray-600 mt-1">
            Automatische Zuweisung von Fahrzeugen und Mitarbeitern zu Routen
          </p>
        </div>
        
        <button
          onClick={saveAssignments}
          disabled={readyAssignments === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Zuweisungen speichern ({readyAssignments})
        </button>
      </div>

      {/* Resource Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Routen</p>
              <p className="text-lg font-semibold text-gray-900">{routes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Verfügbare Fahrzeuge</p>
              <p className="text-lg font-semibold text-gray-900">
                {vehicles.filter(v => v.is_active && !v.assigned_user_id).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Verfügbare Mitarbeiter</p>
              <p className="text-lg font-semibold text-gray-900">
                {workers.filter(w => w.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Bereit für Einsatz</p>
              <p className="text-lg font-semibold text-gray-900">{readyAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">Ressourcen-Konflikte</h3>
          </div>
          <div className="space-y-1">
            {conflicts.map((conflict, index) => (
              <p key={index} className="text-sm text-red-700">
                • {conflict.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Zuweisungs-Übersicht</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Route
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priorität
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fahrzeug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mitarbeiter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Konflikte
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getStatusIcon(assignment.status)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full border ${getStatusColor(assignment.status)}`}>
                        {assignment.status === 'ready' ? 'Bereit' : 
                         assignment.status === 'conflict' ? 'Konflikt' : 'Wartend'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.route_name}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(assignment.route_priority)}`}>
                      {assignment.route_priority}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3">
                    {assignment.vehicle_info ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {assignment.vehicle_info.license_plate}
                        </div>
                        <div className="text-gray-500">
                          {assignment.vehicle_info.brand} {assignment.vehicle_info.model}
                        </div>
                        {assignment.vehicle_info.fuel_percentage && (
                          <div className="text-xs text-gray-500">
                            Tank: {assignment.vehicle_info.fuel_percentage}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Nicht zugewiesen</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {assignment.worker_info ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {assignment.worker_info.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {assignment.worker_info.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Nicht zugewiesen</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    {assignment.conflicts.length > 0 ? (
                      <div className="text-sm text-red-600">
                        {assignment.conflicts.join(', ')}
                      </div>
                    ) : (
                      <span className="text-sm text-green-600">Keine</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Vehicles */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Verfügbare Fahrzeuge
          </h3>
          
          <div className="space-y-3">
            {vehicles
              .filter(v => v.is_active && !v.assigned_user_id)
              .map((vehicle) => (
                <div key={vehicle.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{vehicle.license_plate}</h4>
                      <p className="text-sm text-gray-600">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                    {vehicle.fuel_percentage && (
                      <div className="text-right">
                        <span className={`text-sm font-medium ${
                          vehicle.fuel_percentage >= 50 ? 'text-green-600' :
                          vehicle.fuel_percentage >= 25 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          Tank: {vehicle.fuel_percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Available Workers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Verfügbare Mitarbeiter
          </h3>
          
          <div className="space-y-3">
            {workers
              .filter(w => w.is_active)
              .map((worker) => (
                <div key={worker.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{worker.name}</h4>
                      <p className="text-sm text-gray-600">{worker.email}</p>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      Verfügbar
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePlanner;