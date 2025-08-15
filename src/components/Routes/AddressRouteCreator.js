import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Navigation, AlertCircle, Check } from 'lucide-react';
import geocodingService from '../../services/geocodingService';
import AddressAutocomplete from '../UI/AddressAutocomplete';

const AddressRouteCreator = ({ onRouteCreated, onCancel }) => {
  const [addresses, setAddresses] = useState(['', '']);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingResults, setGeocodingResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState({}); // Store coordinates from autocomplete

  const addAddressField = () => {
    setAddresses([...addresses, '']);
  };

  const removeAddressField = (index) => {
    if (addresses.length > 2) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(newAddresses);
      
      // Remove stored coordinates and reindex
      const newCoordinates = {};
      Object.keys(selectedCoordinates).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newCoordinates[keyIndex] = selectedCoordinates[keyIndex];
        } else if (keyIndex > index) {
          newCoordinates[keyIndex - 1] = selectedCoordinates[keyIndex];
        }
        // Skip the removed index
      });
      setSelectedCoordinates(newCoordinates);
    }
  };

  const updateAddress = (index, value) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
    
    // Clear stored coordinates if user manually changes address
    if (selectedCoordinates[index]) {
      const newCoordinates = { ...selectedCoordinates };
      delete newCoordinates[index];
      setSelectedCoordinates(newCoordinates);
    }
  };

  const handleAddressSelect = (index, addressData) => {
    const newAddresses = [...addresses];
    newAddresses[index] = addressData.address;
    setAddresses(newAddresses);
    
    // Store coordinates from autocomplete
    setSelectedCoordinates(prev => ({
      ...prev,
      [index]: {
        lat: addressData.lat,
        lng: addressData.lng,
        formatted_address: addressData.display_name
      }
    }));
  };

  const validateAddresses = () => {
    const nonEmptyAddresses = addresses.filter(addr => addr.trim());
    
    if (nonEmptyAddresses.length < 2) {
      setErrors(['Mindestens 2 Adressen sind erforderlich']);
      return false;
    }

    const invalidAddresses = nonEmptyAddresses.filter(addr => 
      !geocodingService.validateGermanAddress(addr)
    );

    if (invalidAddresses.length > 0) {
      setErrors([
        'Einige Adressen haben ein ungültiges Format.',
        'Beispiel: "Hauptstraße 123, 20095 Hamburg"'
      ]);
      return false;
    }

    setErrors([]);
    return true;
  };

  const createRoute = async () => {
    if (!validateAddresses()) return;

    setIsGeocoding(true);
    setGeocodingResults([]);
    setErrors([]);

    try {
      const nonEmptyAddresses = addresses.filter(addr => addr.trim());
      console.log('Creating route from addresses:', nonEmptyAddresses);

      const coordinates = [];
      const errors = [];

      // Use autocomplete coordinates where available, otherwise geocode
      for (let i = 0; i < nonEmptyAddresses.length; i++) {
        const address = nonEmptyAddresses[i];
        const addressIndex = addresses.indexOf(address);
        
        if (selectedCoordinates[addressIndex]) {
          // Use coordinates from autocomplete
          const coord = selectedCoordinates[addressIndex];
          coordinates.push({
            lat: coord.lat,
            lng: coord.lng,
            address: coord.formatted_address,
            original_address: address
          });
          console.log(`Used autocomplete coordinates for: ${address}`);
        } else {
          // Geocode this address
          try {
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
            const result = await geocodingService.geocodeAddress(address);
            coordinates.push({
              lat: result.lat,
              lng: result.lng,
              address: result.formatted_address,
              original_address: address
            });
            console.log(`Geocoded address: ${address}`);
          } catch (error) {
            console.error(`Failed to geocode address "${address}":`, error);
            errors.push({
              address,
              error: error.message
            });
          }
        }
      }

      setGeocodingResults(coordinates);

      if (errors.length > 0) {
        setErrors(errors.map(err => `${err.address}: ${err.error}`));
      }

      if (coordinates.length >= 2) {
        // Erstelle Route-Objekt für Parent-Komponente
        const routeData = {
          coordinates: coordinates.map(coord => ({
            lat: coord.lat,
            lng: coord.lng
          })),
          addresses: coordinates.map(coord => coord.original_address),
          formatted_addresses: coordinates.map(coord => coord.address)
        };

        console.log('Route created successfully:', routeData);
        onRouteCreated(routeData);
      } else {
        setErrors(['Nicht genügend gültige Adressen gefunden. Mindestens 2 sind erforderlich.']);
      }

    } catch (error) {
      console.error('Route creation failed:', error);
      setErrors([`Fehler beim Erstellen der Route: ${error.message}`]);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Navigation className="text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Route aus Adressen erstellen</h3>
      </div>

      <div className="space-y-4 mb-6">
        {addresses.map((address, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              {index + 1}
            </div>
            
            <div className="flex-1">
              <AddressAutocomplete
                value={address}
                onChange={(value) => updateAddress(index, value)}
                onSelect={(addressData) => handleAddressSelect(index, addressData)}
                placeholder={index === 0 ? "Startadresse (z.B. Hauptstraße 123, Hamburg)" : 
                           index === addresses.length - 1 ? "Zieladresse" : "Zwischenstopp"}
                disabled={isGeocoding}
                className="w-full"
              />
              {selectedCoordinates[index] && (
                <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <Check size={12} />
                  Koordinaten gefunden: {selectedCoordinates[index].lat.toFixed(4)}, {selectedCoordinates[index].lng.toFixed(4)}
                </div>
              )}
            </div>

            {addresses.length > 2 && (
              <button
                onClick={() => removeAddressField(index)}
                className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-md"
                disabled={isGeocoding}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addAddressField}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          disabled={isGeocoding}
        >
          <Plus size={16} />
          Zwischenstopp hinzufügen
        </button>
      </div>

      {/* Geocoding Results */}
      {geocodingResults.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="text-green-600" size={16} />
            <h4 className="font-medium text-green-800">Gefundene Adressen:</h4>
          </div>
          <ul className="space-y-1">
            {geocodingResults.map((result, index) => (
              <li key={index} className="text-sm text-green-700">
                {index + 1}. {result.address}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-red-600" size={16} />
            <h4 className="font-medium text-red-800">Fehler:</h4>
          </div>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Helper Text */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <MapPin className="text-blue-600 flex-shrink-0" size={16} />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Adressformat-Tipps:</p>
            <ul className="space-y-1">
              <li>• "Hauptstraße 123, 20095 Hamburg"</li>
              <li>• "Rathaus, Hamburg"</li>
              <li>• "Flughafen Hamburg"</li>
              <li>• Immer Stadt/PLZ angeben für beste Ergebnisse</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={createRoute}
          disabled={isGeocoding || addresses.filter(a => a.trim()).length < 2}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGeocoding ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adressen werden gesucht...
            </div>
          ) : (
            'Route erstellen'
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={isGeocoding}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

export default AddressRouteCreator;