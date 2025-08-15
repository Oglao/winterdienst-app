import React, { useState } from 'react';
import { X, Plus, MapPin, Navigation, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { PRIORITY_LEVELS, ROUTE_STATUS } from '../../utils/constants';
import AddressRouteCreator from './AddressRouteCreator';

const RouteForm = ({ isOpen, onClose, route = null }) => {
  const { workers, routes, setRoutes } = useAppContext();
  const [formData, setFormData] = useState({
    name: route?.name || '',
    description: route?.description || '',
    priority: route?.priority || PRIORITY_LEVELS.MEDIUM,
    assignedWorker: route?.assignedWorker || '',
    estimatedDuration: route?.estimatedDuration || 120,
    scheduledStart: route?.scheduledStart || '',
    coordinates: route?.coordinates || []
  });

  const [newCoordinate, setNewCoordinate] = useState({ lat: '', lng: '' });
  const [useAddressInput, setUseAddressInput] = useState(false);
  const [showAddressCreator, setShowAddressCreator] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const routeData = {
      ...formData,
      id: route?.id || Date.now(),
      status: route?.status || ROUTE_STATUS.PLANNED,
      createdAt: route?.createdAt || new Date().toISOString()
    };

    if (route) {
      // Update existing route
      setRoutes(routes.map(r => r.id === route.id ? routeData : r));
    } else {
      // Create new route
      setRoutes([...routes, routeData]);
    }

    onClose();
  };

  const addCoordinate = () => {
    if (newCoordinate.lat && newCoordinate.lng) {
      setFormData({
        ...formData,
        coordinates: [
          ...formData.coordinates,
          {
            lat: parseFloat(newCoordinate.lat),
            lng: parseFloat(newCoordinate.lng),
            order: formData.coordinates.length
          }
        ]
      });
      setNewCoordinate({ lat: '', lng: '' });
    }
  };

  const removeCoordinate = (index) => {
    setFormData({
      ...formData,
      coordinates: formData.coordinates.filter((_, i) => i !== index)
    });
  };

  const handleRouteCreated = (routeData) => {
    setFormData({
      ...formData,
      coordinates: routeData.coordinates.map((coord, index) => ({
        ...coord,
        order: index,
        address: routeData.formatted_addresses[index]
      }))
    });
    setShowAddressCreator(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {route ? 'Route bearbeiten' : 'Neue Route erstellen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorität
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={PRIORITY_LEVELS.LOW}>Niedrig</option>
                <option value={PRIORITY_LEVELS.MEDIUM}>Mittel</option>
                <option value={PRIORITY_LEVELS.HIGH}>Hoch</option>
                <option value={PRIORITY_LEVELS.CRITICAL}>Kritisch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zugewiesener Mitarbeiter
              </label>
              <select
                value={formData.assignedWorker}
                onChange={(e) => setFormData({ ...formData, assignedWorker: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Mitarbeiter auswählen</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.name}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschätzte Dauer (Minuten)
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geplante Startzeit
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledStart}
              onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Koordinaten-Sektion */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Route-Koordinaten
              </label>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Koordinaten</span>
                <button
                  type="button"
                  onClick={() => setUseAddressInput(!useAddressInput)}
                  className="flex items-center"
                >
                  {useAddressInput ? (
                    <ToggleRight className="text-blue-600" size={24} />
                  ) : (
                    <ToggleLeft className="text-gray-400" size={24} />
                  )}
                </button>
                <span className="text-sm text-gray-600">Adressen</span>
              </div>
            </div>

            {useAddressInput ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="text-blue-600" size={16} />
                    <span className="text-sm font-medium text-blue-800">
                      Route aus Adressen erstellen
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Geben Sie Adressen ein, um automatisch GPS-Koordinaten zu erhalten.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddressCreator(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Adressen eingeben
                  </button>
                </div>

                {formData.coordinates.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      {formData.coordinates.length} Koordinaten aus Adressen hinzugefügt
                    </p>
                    <div className="space-y-1">
                      {formData.coordinates.map((coord, index) => (
                        <div key={index} className="text-xs text-green-700">
                          {index + 1}. {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                          {coord.address && <span className="ml-2 text-green-600">({coord.address})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                type="number"
                step="any"
                placeholder="Breitengrad"
                value={newCoordinate.lat}
                onChange={(e) => setNewCoordinate({ ...newCoordinate, lat: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="any"
                placeholder="Längengrad"
                value={newCoordinate.lng}
                onChange={(e) => setNewCoordinate({ ...newCoordinate, lng: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addCoordinate}
                className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.coordinates.map((coord, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">
                      {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCoordinate(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {route ? 'Aktualisieren' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>

      {/* Address Route Creator Modal */}
      {showAddressCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
            <AddressRouteCreator
              onRouteCreated={handleRouteCreated}
              onCancel={() => setShowAddressCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteForm;