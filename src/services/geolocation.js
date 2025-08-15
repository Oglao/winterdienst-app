export class GeolocationService {
    constructor() {
      this.watchId = null;
      this.callbacks = [];
    }
  
    startTracking(callback, options = {}) {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird nicht unterstützt');
      }
  
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      };
  
      this.callbacks.push(callback);
  
      if (!this.watchId) {
        this.watchId = navigator.geolocation.watchPosition(
          (position) => {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            };
            
            this.callbacks.forEach(cb => cb(locationData, null));
          },
          (error) => {
            // Convert GeolocationPositionError to readable format
            const errorInfo = {
              code: error.code,
              message: error.message,
              type: 'GeolocationPositionError',
              timestamp: new Date()
            };
            
            console.warn('🚫 Geolocation error in watchPosition:', JSON.stringify(errorInfo));
            this.callbacks.forEach(cb => cb(null, errorInfo));
          },
          defaultOptions
        );
      }
  
      return this.watchId;
    }
  
    stopTracking() {
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
        this.callbacks = [];
      }
    }
  
    getCurrentPosition() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          console.warn('Geolocation not supported, using Hamburg center');
          resolve({
            latitude: 53.5511,
            longitude: 9.9937,
            accuracy: 1000,
            timestamp: new Date(),
            isMockLocation: true
          });
          return;
        }

        const timeoutId = setTimeout(() => {
          console.warn('Geolocation timeout, using Hamburg center');
          resolve({
            latitude: 53.5511,
            longitude: 9.9937,
            accuracy: 1000,
            timestamp: new Date(),
            isMockLocation: true
          });
        }, 5000); // 5s timeout
  
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            });
          },
          (error) => {
            clearTimeout(timeoutId);
            const errorInfo = {
              code: error.code,
              message: error.message,
              type: 'GeolocationPositionError'
            };
            
            console.warn('🚫 Geolocation error in getCurrentPosition:', JSON.stringify(errorInfo));
            console.log('📍 Using Hamburg center as fallback location');
            
            resolve({
              latitude: 53.5511,
              longitude: 9.9937,
              accuracy: 1000,
              timestamp: new Date(),
              isMockLocation: true,
              error: errorInfo
            });
          },
          {
            enableHighAccuracy: false, // Weniger akkurat aber schneller
            timeout: 4000,
            maximumAge: 300000 // 5 min cache
          }
        );
      });
    }
  }
  
  export const geolocationService = new GeolocationService();