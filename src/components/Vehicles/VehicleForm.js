import React, { useState, useEffect } from 'react';
import { Car, Save, X } from 'lucide-react';

const VehicleForm = ({ vehicle = null, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'diesel',
    tank_capacity: '',
    current_fuel_level: '',
    current_mileage: '',
    assigned_user_id: '',
    last_oil_change_mileage: '',
    tuv_expiry_date: '',
    insurance_expiry_date: ''
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUsers();
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        fuel_type: vehicle.fuel_type || 'diesel',
        tank_capacity: vehicle.tank_capacity || '',
        current_fuel_level: vehicle.current_fuel_level || '',
        current_mileage: vehicle.current_mileage || '',
        assigned_user_id: vehicle.assigned_user_id || '',
        last_oil_change_mileage: vehicle.last_oil_change_mileage || '',
        tuv_expiry_date: vehicle.tuv_expiry_date ? vehicle.tuv_expiry_date.split('T')[0] : '',
        insurance_expiry_date: vehicle.insurance_expiry_date ? vehicle.insurance_expiry_date.split('T')[0] : ''
      });
    }
  }, [vehicle]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'Kennzeichen ist erforderlich';
    }
    
    if (!formData.brand.trim()) {
      newErrors.brand = 'Marke ist erforderlich';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Modell ist erforderlich';
    }
    
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Gültiges Baujahr erforderlich';
    }
    
    if (!formData.tank_capacity || formData.tank_capacity <= 0) {
      newErrors.tank_capacity = 'Tankkapazität muss größer als 0 sein';
    }
    
    if (formData.current_fuel_level && parseFloat(formData.current_fuel_level) > parseFloat(formData.tank_capacity)) {
      newErrors.current_fuel_level = 'Tankstand kann nicht größer als Kapazität sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : '/api/vehicles';
      const method = vehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tank_capacity: parseFloat(formData.tank_capacity),
          current_fuel_level: formData.current_fuel_level ? parseFloat(formData.current_fuel_level) : null,
          current_mileage: formData.current_mileage ? parseInt(formData.current_mileage) : 0,
          last_oil_change_mileage: formData.last_oil_change_mileage ? parseInt(formData.last_oil_change_mileage) : null,
          year: parseInt(formData.year)
        })
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        if (error.error && error.error.includes('Kennzeichen')) {
          setErrors({ license_plate: 'Kennzeichen bereits vergeben' });
        } else {
          alert('Fehler beim Speichern: ' + error.error);
        }
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Car className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">
              {vehicle ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kennzeichen *
              </label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors.license_plate ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="z.B. HH-AB 123"
              />
              {errors.license_plate && (
                <p className="text-red-500 text-xs mt-1">{errors.license_plate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zugewiesener Mitarbeiter
              </label>
              <select
                name="assigned_user_id"
                value={formData.assigned_user_id}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Nicht zugewiesen</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marke *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors.brand ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="z.B. Mercedes"
              />
              {errors.brand && (
                <p className="text-red-500 text-xs mt-1">{errors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modell *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${errors.model ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="z.B. Sprinter"
              />
              {errors.model && (
                <p className="text-red-500 text-xs mt-1">{errors.model}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baujahr *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`w-full p-2 border rounded-md ${errors.year ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.year && (
                <p className="text-red-500 text-xs mt-1">{errors.year}</p>
              )}
            </div>
          </div>

          {/* Fuel Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kraftstoffart
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="diesel">Diesel</option>
                <option value="benzin">Benzin</option>
                <option value="elektro">Elektro</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tankkapazität (L) *
              </label>
              <input
                type="number"
                name="tank_capacity"
                value={formData.tank_capacity}
                onChange={handleInputChange}
                step="0.1"
                min="1"
                className={`w-full p-2 border rounded-md ${errors.tank_capacity ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="z.B. 80"
              />
              {errors.tank_capacity && (
                <p className="text-red-500 text-xs mt-1">{errors.tank_capacity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktueller Tankstand (L)
              </label>
              <input
                type="number"
                name="current_fuel_level"
                value={formData.current_fuel_level}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={`w-full p-2 border rounded-md ${errors.current_fuel_level ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Optional"
              />
              {errors.current_fuel_level && (
                <p className="text-red-500 text-xs mt-1">{errors.current_fuel_level}</p>
              )}
            </div>
          </div>

          {/* Maintenance Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktueller KM-Stand
              </label>
              <input
                type="number"
                name="current_mileage"
                value={formData.current_mileage}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="z.B. 45000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Letzter Ölwechsel (km)
              </label>
              <input
                type="number"
                name="last_oil_change_mileage"
                value={formData.last_oil_change_mileage}
                onChange={handleInputChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="z.B. 30000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TÜV gültig bis
              </label>
              <input
                type="date"
                name="tuv_expiry_date"
                value={formData.tuv_expiry_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Versicherung gültig bis
              </label>
              <input
                type="date"
                name="insurance_expiry_date"
                value={formData.insurance_expiry_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Speichern...' : 'Speichern'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleForm;