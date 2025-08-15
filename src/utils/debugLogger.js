// Debug Logger für die Winterdienst-App
export const debugLogger = {
  log: (component, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🐛 [${timestamp}] ${component}:`, message, data || '');
  },

  warn: (component, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`⚠️ [${timestamp}] ${component}:`, message, data || '');
  },

  error: (component, message, error = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`❌ [${timestamp}] ${component}:`, message, error || '');
  },

  success: (component, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`✅ [${timestamp}] ${component}:`, message, data || '');
  },

  // Performance Timing
  startTimer: (name) => {
    console.time(`⏱️ ${name}`);
  },

  endTimer: (name) => {
    console.timeEnd(`⏱️ ${name}`);
  },

  // App Status Check
  logAppStatus: () => {
    debugLogger.log('APP STATUS', '🔍 Checking app components...');
    
    // Service Worker
    if ('serviceWorker' in navigator) {
      debugLogger.success('SERVICE WORKER', 'Available');
    } else {
      debugLogger.warn('SERVICE WORKER', 'Not available');
    }

    // Geolocation
    if ('geolocation' in navigator) {
      debugLogger.success('GEOLOCATION', 'Available');
    } else {
      debugLogger.warn('GEOLOCATION', 'Not available');
    }

    // Camera
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      debugLogger.success('CAMERA', 'Available');
    } else {
      debugLogger.warn('CAMERA', 'Not available');
    }

    // Local Storage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      debugLogger.success('LOCAL STORAGE', 'Available');
    } catch (e) {
      debugLogger.warn('LOCAL STORAGE', 'Not available');
    }

    // Network Status
    if ('onLine' in navigator) {
      debugLogger.log('NETWORK', navigator.onLine ? 'Online' : 'Offline');
    }
  }
};

// Auto-log app status in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debugLogger.logAppStatus();
  }, 1000);
}

export default debugLogger;