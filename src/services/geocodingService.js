// Geocoding Service - Adresse zu Koordinaten Umwandlung

class GeocodingService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    this.useNominatim = !this.apiKey; // Fallback zu OpenStreetMap Nominatim wenn kein Google API Key
  }

  /**
   * Konvertiert eine Adresse zu GPS-Koordinaten
   * @param {string} address - Vollständige Adresse (z.B. "Hauptstraße 123, Hamburg")
   * @returns {Promise<{lat: number, lng: number, formatted_address: string}>}
   */
  async geocodeAddress(address) {
    try {
      if (this.useNominatim) {
        return await this.geocodeWithNominatim(address);
      } else {
        return await this.geocodeWithGoogle(address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Adresse konnte nicht gefunden werden: ${error.message}`);
    }
  }

  /**
   * Geocoding mit OpenStreetMap Nominatim (kostenlos)
   */
  async geocodeWithNominatim(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=de`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Winterdienst-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Nominatim API request failed');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error('Adresse nicht gefunden');
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name
    };
  }

  /**
   * Geocoding mit Google Maps API (benötigt API Key)
   */
  async geocodeWithGoogle(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}&region=de`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Google Geocoding API request failed');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || data.results.length === 0) {
      throw new Error(`Google Geocoding error: ${data.status}`);
    }

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address
    };
  }

  /**
   * Reverse Geocoding - Koordinaten zu Adresse
   * @param {number} lat - Breitengrad
   * @param {number} lng - Längengrad
   * @returns {Promise<string>} - Formatierte Adresse
   */
  async reverseGeocode(lat, lng) {
    try {
      if (this.useNominatim) {
        return await this.reverseGeocodeWithNominatim(lat, lng);
      } else {
        return await this.reverseGeocodeWithGoogle(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Fallback zu Koordinaten
    }
  }

  async reverseGeocodeWithNominatim(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Winterdienst-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Nominatim reverse API request failed');
    }

    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  }

  async reverseGeocodeWithGoogle(lat, lng) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=de`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Google reverse geocoding API request failed');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || data.results.length === 0) {
      throw new Error(`Google reverse geocoding error: ${data.status}`);
    }

    return data.results[0].formatted_address;
  }

  /**
   * Batch Geocoding für mehrere Adressen
   * @param {string[]} addresses - Array von Adressen
   * @returns {Promise<Array>} - Array von Koordinaten-Objekten
   */
  async geocodeMultipleAddresses(addresses) {
    const results = [];
    
    for (const address of addresses) {
      try {
        // Kleine Verzögerung um Rate Limits zu vermeiden
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const coords = await this.geocodeAddress(address);
        results.push({
          address,
          success: true,
          coordinates: coords
        });
      } catch (error) {
        results.push({
          address,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Validiert eine deutsche Adresse
   * @param {string} address - Zu validierende Adresse
   * @returns {boolean} - true wenn Format korrekt ist
   */
  validateGermanAddress(address) {
    // Basis-Validierung für deutsche Adressen
    const patterns = [
      /^.+\s+\d+.*,\s*\d{5}\s+.+$/, // "Straße 123, 12345 Stadt"
      /^.+\s+\d+.*\s+\d{5}\s+.+$/, // "Straße 123 12345 Stadt"
      /.+\d+.*/  // Mindestens eine Hausnummer
    ];
    
    return patterns.some(pattern => pattern.test(address.trim()));
  }

  /**
   * Erstellt Route-Koordinaten aus Adressliste
   * @param {string[]} addresses - Array von Adressen in Reihenfolge
   * @returns {Promise<Array>} - Array von {lat, lng} Objekten
   */
  async createRouteFromAddresses(addresses) {
    console.log('Creating route from addresses:', addresses);
    
    const coordinates = [];
    const errors = [];
    
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i].trim();
      
      if (!address) continue;
      
      try {
        console.log(`Geocoding address ${i + 1}/${addresses.length}: ${address}`);
        
        // Kleine Verzögerung um Rate Limits zu vermeiden
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const result = await this.geocodeAddress(address);
        coordinates.push({
          lat: result.lat,
          lng: result.lng,
          address: result.formatted_address,
          original_address: address
        });
        
      } catch (error) {
        console.error(`Failed to geocode address "${address}":`, error);
        errors.push({
          address,
          error: error.message
        });
      }
    }
    
    return {
      coordinates,
      errors,
      success: coordinates.length > 0
    };
  }
}

// Export als Singleton
const geocodingService = new GeocodingService();
export default geocodingService;