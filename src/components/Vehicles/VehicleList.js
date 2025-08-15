import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import VehicleCard from './VehicleCard';
import FuelTracker from './FuelTracker';
import VehicleForm from './VehicleForm';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showFuelTracker, setShowFuelTracker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const vehicleData = await response.json();
        setVehicles(vehicleData);
        
        // Load alerts for all vehicles
        const alertPromises = vehicleData.map(async (vehicle) => {
          try {
            const alertResponse = await fetch(`/api/vehicles/${vehicle.id}/maintenance-alerts`);
            if (alertResponse.ok) {
              const vehicleAlerts = await alertResponse.json();
              return { vehicleId: vehicle.id, alerts: vehicleAlerts };
            }
          } catch (error) {
            console.error(`Error loading alerts for vehicle ${vehicle.id}:`, error);
          }
          return { vehicleId: vehicle.id, alerts: [] };
        });
        
        const alertResults = await Promise.all(alertPromises);
        const alertsMap = {};
        alertResults.forEach(({ vehicleId, alerts }) => {
          alertsMap[vehicleId] = alerts;
        });
        setAlerts(alertsMap);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFuel = async (vehicleId, fuelLevel, mileage) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/fuel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fuel_level: fuelLevel,
          mileage: mileage
        })
      });

      if (response.ok) {
        await loadVehicles(); // Reload to get updated data
      }
    } catch (error) {
      console.error('Error updating fuel level:', error);
    }
  };

  const openFuelTracker = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowFuelTracker(true);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.assigned_user_name && vehicle.assigned_user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'low_fuel') return matchesSearch && vehicle.fuel_percentage < 25;
    if (filterStatus === 'alerts') return matchesSearch && alerts[vehicle.id]?.length > 0;
    if (filterStatus === 'unassigned') return matchesSearch && !vehicle.assigned_user_id;
    
    return matchesSearch;
  });

  const totalAlerts = Object.values(alerts).reduce((sum, vehicleAlerts) => sum + vehicleAlerts.length, 0);
  const lowFuelCount = vehicles.filter(v => v.fuel_percentage < 25).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fahrzeugverwaltung</h1>
          <p className="text-gray-600 mt-1">
            {vehicles.length} Fahrzeuge • {totalAlerts} Warnungen • {lowFuelCount} wenig Sprit
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Fahrzeug hinzufügen</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Gesamt</p>
              <p className="text-lg font-semibold text-gray-900">{vehicles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Warnungen</p>
              <p className="text-lg font-semibold text-gray-900">{totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Wenig Sprit</p>
              <p className="text-lg font-semibold text-gray-900">{lowFuelCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Nicht zugewiesen</p>
              <p className="text-lg font-semibold text-gray-900">
                {vehicles.filter(v => !v.assigned_user_id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Fahrzeuge suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Alle Fahrzeuge</option>
          <option value="low_fuel">Wenig Sprit</option>
          <option value="alerts">Mit Warnungen</option>
          <option value="unassigned">Nicht zugewiesen</option>
        </select>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            alerts={alerts[vehicle.id] || []}
            onSelect={(vehicle) => console.log('Selected vehicle:', vehicle)}
            onUpdateFuel={openFuelTracker}
          />
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Keine Fahrzeuge gefunden</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showFuelTracker && selectedVehicle && (
        <FuelTracker
          vehicle={selectedVehicle}
          onClose={() => setShowFuelTracker(false)}
          onUpdateFuel={handleUpdateFuel}
        />
      )}

      {showAddForm && (
        <VehicleForm
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            setShowAddForm(false);
            loadVehicles();
          }}
        />
      )}
    </div>
  );
};

export default VehicleList;