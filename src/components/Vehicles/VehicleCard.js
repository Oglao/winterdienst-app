import React from 'react';
import { Car, Fuel, AlertTriangle, Wrench } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';

const VehicleCard = ({ vehicle, onSelect, onUpdateFuel, alerts = [] }) => {
  const getFuelColor = (percentage) => {
    if (percentage >= 50) return 'text-green-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFuelBgColor = (percentage) => {
    if (percentage >= 50) return 'bg-green-100';
    if (percentage >= 25) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const hasAlerts = alerts && alerts.length > 0;
  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high').length;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 border cursor-pointer transition-all hover:shadow-lg ${
        hasAlerts ? 'border-orange-200' : 'border-gray-200'
      }`}
      onClick={() => onSelect(vehicle)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Car className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {vehicle.license_plate}
          </h3>
        </div>
        
        {hasAlerts && (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">
              {highPriorityAlerts > 0 ? `${highPriorityAlerts} dringend` : `${alerts.length} Hinweis(e)`}
            </span>
          </div>
        )}
      </div>

      {/* Vehicle Info */}
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </p>
        {vehicle.assigned_user_name && (
          <p className="text-xs text-gray-500 mt-1">
            Zugewiesen: {vehicle.assigned_user_name}
          </p>
        )}
      </div>

      {/* Fuel Level */}
      {vehicle.fuel_percentage !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Fuel className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Tank</span>
            </div>
            <span className={`text-sm font-medium ${getFuelColor(vehicle.fuel_percentage)}`}>
              {vehicle.fuel_percentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                vehicle.fuel_percentage >= 50 ? 'bg-green-500' :
                vehicle.fuel_percentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(vehicle.fuel_percentage, 5)}%` }}
            />
          </div>
          
          {vehicle.current_fuel_level && vehicle.tank_capacity && (
            <p className="text-xs text-gray-500 mt-1">
              {vehicle.current_fuel_level}L / {vehicle.tank_capacity}L
            </p>
          )}
        </div>
      )}

      {/* Maintenance Status */}
      {vehicle.current_mileage && (
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>KM-Stand: {vehicle.current_mileage.toLocaleString()}</span>
          {hasAlerts && (
            <div className="flex items-center space-x-1">
              <Wrench className="w-3 h-3" />
              <span>Wartung prüfen</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2 mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdateFuel(vehicle);
          }}
          className="flex-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
        >
          Tank aktualisieren
        </button>
        
        {vehicle.fuel_percentage < 25 && (
          <StatusBadge 
            status="warning" 
            text="Tanken" 
            className="text-xs px-2 py-1"
          />
        )}
      </div>

      {/* Alert Summary */}
      {hasAlerts && (
        <div className="mt-2 p-2 bg-orange-50 rounded border-l-2 border-orange-200">
          <p className="text-xs text-orange-700">
            {alerts.slice(0, 2).map(alert => alert.message).join(', ')}
            {alerts.length > 2 && '...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleCard;