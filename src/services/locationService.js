// Location Service für GPS-Tracking und Standort-Updates

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class LocationService {
  // Standort an Server senden
  static async updateUserLocation(location) {
    try {
      const response = await fetch(`${API_URL}/tracking/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          workerId: localStorage.getItem('userId'),
          location: {
            lat: location.lat,
            lng: location.lng
          },
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Standort-Update fehlgeschlagen');
      }

      return await response.json();
    } catch (error) {
      console.error('Location update error:', error);
      throw error;
    }
  }

  // Routen-Punkte an Server senden
  static async createRoute(routeData) {
    try {
      const response = await fetch(`${API_URL}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: routeData.name || `Route ${new Date().toLocaleDateString()}`,
          coordinates: routeData.coordinates,
          start_time: routeData.startTime || '08:00',
          estimated_duration: routeData.estimatedDuration || '2h',
          priority: routeData.priority || 'mittel',
          status: 'geplant'
        })
      });

      if (!response.ok) {
        throw new Error('Route-Erstellung fehlgeschlagen');
      }

      return await response.json();
    } catch (error) {
      console.error('Route creation error:', error);
      throw error;
    }
  }

  // Aktuelle Position von Browser ermitteln
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation wird nicht unterstützt'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          });
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Standort-Zugriff wurde verweigert';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Standort nicht verfügbar';
              break;
            case error.TIMEOUT:
              errorMessage = 'Standort-Anfrage Timeout';
              break;
            default:
              errorMessage = 'Unbekannter Standort-Fehler';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Kontinuierliches GPS-Tracking starten
  static startTracking(onLocationUpdate, onError) {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation wird nicht unterstützt'));
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        };
        
        onLocationUpdate(location);
        
        // Automatisch an Server senden
        this.updateUserLocation(location).catch(error => {
          console.warn('Auto location update failed:', error);
        });
      },
      (error) => {
        onError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );

    return watchId;
  }

  // GPS-Tracking stoppen
  static stopTracking(watchId) {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  // Entfernung zwischen zwei Punkten berechnen (Haversine)
  static calculateDistance(point1, point2) {
    const R = 6371000; // Earth radius in meters
    const lat1Rad = point1.lat * (Math.PI / 180);
    const lat2Rad = point2.lat * (Math.PI / 180);
    const deltaLatRad = (point2.lat - point1.lat) * (Math.PI / 180);
    const deltaLngRad = (point2.lng - point1.lng) * (Math.PI / 180);

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  }
}

export default LocationService;