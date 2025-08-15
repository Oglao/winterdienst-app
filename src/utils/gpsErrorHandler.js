/**
 * GPS Error Handler Utility
 * Provides consistent error handling for GeolocationPositionError across the app
 */

export const GPS_ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3
};

export const getGPSErrorInfo = (error) => {
  // Handle both raw GeolocationPositionError and our custom error objects
  const code = error.code || error.PERMISSION_DENIED || 1;
  const message = error.message || 'Unknown GPS error';
  
  let userFriendlyMessage = '';
  let recommendation = '';
  
  switch (code) {
    case GPS_ERROR_CODES.PERMISSION_DENIED:
      userFriendlyMessage = 'Standort-Berechtigung verweigert';
      recommendation = 'Bitte aktivieren Sie die Standortfreigabe in Ihren Browser-Einstellungen und laden Sie die Seite neu.';
      break;
      
    case GPS_ERROR_CODES.POSITION_UNAVAILABLE:
      userFriendlyMessage = 'Standort-Information nicht verfügbar';
      recommendation = 'Bitte prüfen Sie Ihre GPS-Einstellungen oder versuchen Sie es an einem anderen Ort.';
      break;
      
    case GPS_ERROR_CODES.TIMEOUT:
      userFriendlyMessage = 'Standort-Anfrage Timeout';
      recommendation = 'Die GPS-Ortung dauert zu lange. Versuchen Sie es erneut oder verwenden Sie die Simulation.';
      break;
      
    default:
      userFriendlyMessage = 'Unbekannter GPS-Fehler';
      recommendation = 'Verwenden Sie die "Simulate Movement" Funktion zum Testen ohne echten GPS.';
      break;
  }
  
  return {
    code,
    message,
    userFriendlyMessage,
    recommendation,
    type: 'GeolocationPositionError',
    timestamp: new Date()
  };
};

export const logGPSError = (error, component = 'Unknown') => {
  try {
    const errorInfo = getGPSErrorInfo(error);
    
    // Use safe logging without passing raw error objects
    const safeLog = {
      component,
      type: errorInfo.type,
      code: errorInfo.code,
      userMessage: errorInfo.userFriendlyMessage,
      recommendation: errorInfo.recommendation,
      timestamp: errorInfo.timestamp
    };
    
    console.group(`🚫 GPS Error in ${component}`);
    console.warn('Error Details:', JSON.stringify(safeLog, null, 2));
    console.groupEnd();
    
    return errorInfo;
  } catch (logError) {
    // Fallback if even logging fails
    console.warn('GPS Error logging failed:', component);
    return {
      code: 999,
      message: 'Error logging failed',
      userFriendlyMessage: 'GPS-Fehler aufgetreten',
      recommendation: 'Verwenden Sie die Simulate Movement Funktion',
      type: 'SafeError',
      timestamp: new Date()
    };
  }
};

export const createGPSErrorHandler = (component, onError) => {
  return (error) => {
    const errorInfo = logGPSError(error, component);
    
    if (onError && typeof onError === 'function') {
      onError(errorInfo);
    }
    
    return errorInfo;
  };
};

// Hamburg fallback coordinates for testing
export const HAMBURG_FALLBACK = {
  latitude: 53.5511,
  longitude: 9.9937,
  accuracy: 1000,
  timestamp: new Date(),
  isMockLocation: true
};

export const getFallbackPosition = (error = null) => {
  const position = { ...HAMBURG_FALLBACK };
  
  if (error) {
    position.error = getGPSErrorInfo(error);
  }
  
  console.log('📍 Using Hamburg fallback position:', position);
  return position;
};