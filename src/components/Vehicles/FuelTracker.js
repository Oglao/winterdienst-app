import React, { useState, useEffect } from 'react';
import { Fuel, Plus, TrendingUp, MapPin, Calendar } from 'lucide-react';

const FuelTracker = ({ vehicle, onClose, onUpdateFuel }) => {
  const [fuelData, setFuelData] = useState({
    amount: '',
    cost: '',
    price_per_liter: '',
    location: '',
    mileage: vehicle?.current_mileage || '',
    is_full_tank: false,
    new_fuel_level: '',
    notes: ''
  });

  const [fuelHistory, setFuelHistory] = useState([]);
  const [consumption, setConsumption] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle?.id) {
      loadFuelHistory();
      loadConsumption();
    }
  }, [vehicle]);

  const loadFuelHistory = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/fuel-history`);
      if (response.ok) {
        const history = await response.json();
        setFuelHistory(history);
      }
    } catch (error) {
      console.error('Error loading fuel history:', error);
    }
  };

  const loadConsumption = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/consumption`);
      if (response.ok) {
        const data = await response.json();
        setConsumption(data);
      }
    } catch (error) {
      console.error('Error loading consumption:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFuelData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate price per liter
    if (name === 'amount' || name === 'cost') {
      const amount = parseFloat(name === 'amount' ? value : fuelData.amount);
      const cost = parseFloat(name === 'cost' ? value : fuelData.cost);
      
      if (amount > 0 && cost > 0) {
        setFuelData(prev => ({
          ...prev,
          price_per_liter: (cost / amount).toFixed(3)
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/fuel-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fuelData)
      });

      if (response.ok) {
        await loadFuelHistory();
        if (fuelData.new_fuel_level) {
          onUpdateFuel(vehicle.id, fuelData.new_fuel_level, fuelData.mileage);
        }
        
        // Reset form
        setFuelData({
          amount: '',
          cost: '',
          price_per_liter: '',
          location: '',
          mileage: '',
          is_full_tank: false,
          new_fuel_level: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        alert('Fehler beim Speichern: ' + error.message);
      }
    } catch (error) {
      console.error('Error saving fuel entry:', error);
      alert('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Fuel className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">
              Tankbuch - {vehicle?.license_plate}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Fuel Entry Form */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Tankvorgang hinzufügen
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Getankt (Liter)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={fuelData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gesamtkosten (€)
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={fuelData.cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preis/Liter (€)
                  </label>
                  <input
                    type="number"
                    name="price_per_liter"
                    value={fuelData.price_per_liter}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    readOnly={fuelData.amount && fuelData.cost}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    KM-Stand
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={fuelData.mileage}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tankstelle
                </label>
                <input
                  type="text"
                  name="location"
                  value={fuelData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="z.B. Shell Hamburger Straße"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neuer Tankstand (Liter)
                </label>
                <input
                  type="number"
                  name="new_fuel_level"
                  value={fuelData.new_fuel_level}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max={vehicle?.tank_capacity}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Nach dem Tanken"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_full_tank"
                  checked={fuelData.is_full_tank}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Vollgetankt
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  name="notes"
                  value={fuelData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Zusätzliche Informationen..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Speichern...' : 'Tankvorgang speichern'}
              </button>
            </form>
          </div>

          {/* Stats and History */}
          <div className="space-y-6">
            {/* Consumption Stats */}
            {consumption && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Verbrauchsstatistik
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Durchschnitt:</span>
                    <p className="font-semibold">{consumption.avg_consumption}L/100km</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Gesamtstrecke:</span>
                    <p className="font-semibold">{consumption.total_distance} km</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Gesamtverbrauch:</span>
                    <p className="font-semibold">{consumption.total_fuel}L</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fahrten:</span>
                    <p className="font-semibold">{consumption.sessions_count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fuel History */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Letzte Tankvorgänge
              </h4>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fuelHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Tankvorgänge vorhanden</p>
                ) : (
                  fuelHistory.map((entry) => (
                    <div key={entry.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Fuel className="w-3 h-3" />
                            <span className="font-medium">{entry.amount}L</span>
                            {entry.cost && (
                              <span className="text-gray-600">• {entry.cost}€</span>
                            )}
                            {entry.is_full_tank && (
                              <span className="bg-green-100 text-green-700 px-1 rounded text-xs">
                                Voll
                              </span>
                            )}
                          </div>
                          {entry.location && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{entry.location}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      {entry.mileage && (
                        <div className="text-xs text-gray-500 mt-1">
                          KM: {entry.mileage.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelTracker;