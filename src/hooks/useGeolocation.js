import { useState, useEffect } from 'react';
import { createGPSErrorHandler } from '../utils/gpsErrorHandler';

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird nicht unterstützt');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        });
        setError(null);
        setLoading(false);
      },
      (error) => {
        const gpsErrorHandler = createGPSErrorHandler('useGeolocation', (errorInfo) => {
          setError(errorInfo.userFriendlyMessage || errorInfo.message);
        });
        gpsErrorHandler(error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, loading };
};