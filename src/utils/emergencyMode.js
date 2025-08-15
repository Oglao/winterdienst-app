// Emergency Recovery Mode für die Winterdienst-App
export const emergencyMode = {
  isEnabled: () => {
    return localStorage.getItem('emergency_mode') === 'true' || 
           window.location.search.includes('emergency=true');
  },

  enable: () => {
    localStorage.setItem('emergency_mode', 'true');
    console.log('🚨 Emergency Mode ENABLED');
  },

  disable: () => {
    localStorage.removeItem('emergency_mode');
    console.log('✅ Emergency Mode DISABLED');
  },

  // Sichere Demo-Daten ohne externe API-Calls
  getSafeDemoData: () => ({
    user: {
      id: 1,
      name: 'Demo User',
      email: 'demo@winterdienst.de',
      role: 'admin'
    },
    workers: [
      {
        id: 1,
        name: 'Max Müller',
        position: { lat: 53.5511, lng: 9.9937 },
        status: 'aktiv',
        currentRoute: 'Hamburg Center',
        workTime: '2h 15min',
        lastUpdate: new Date().toLocaleTimeString()
      }
    ],
    routes: [
      {
        id: 1,
        name: 'Hamburg Test Route',
        status: 'geplant',
        startTime: '06:00',
        estimatedDuration: '2h',
        priority: 'hoch',
        assignedWorker: 'Max Müller',
        coordinates: [
          { lat: 53.5511, lng: 9.9937 },
          { lat: 53.5600, lng: 10.0000 }
        ]
      }
    ],
    weather: {
      location: 'Hamburg',
      temperature: -2,
      condition: 'Schnee',
      roadCondition: 'snowy',
      saltRecommendation: { 
        amount: 'medium', 
        description: 'Normale Salzung' 
      },
      warningLevel: 'low'
    }
  }),

  // Sichere Komponenten-Props ohne API-Calls
  getSafeProps: () => ({
    disableAPIcalls: true,
    useMockData: true,
    disableGeolocation: true,
    skipAnimations: true
  })
};

// Auto-enable Emergency Mode bei wiederholten Fehlern
let errorCount = 0;
window.addEventListener('error', (event) => {
  errorCount++;
  
  // Safe error logging to prevent GeolocationPositionError display issues
  const safeError = event.error && typeof event.error === 'object' 
    ? `${event.error.constructor?.name || 'Error'}: ${event.error.message || 'Unknown error'}`
    : event.error;
  
  console.error('🚨 JavaScript Error:', safeError);
  
  if (errorCount >= 3) {
    console.warn('🚨 Too many errors, enabling Emergency Mode');
    emergencyMode.enable();
    window.location.reload();
  }
});

// Performance Monitor (disabled to prevent React loops)
let performanceWarnings = 0;

// Simple network error detector without console override
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
      event.reason.toString().includes('timeout') || 
      event.reason.toString().includes('network') || 
      event.reason.toString().includes('fetch')
  )) {
    performanceWarnings++;
    
    if (performanceWarnings >= 2) {
      console.warn('🚨 Network issues detected, consider Emergency Mode');
    }
  }
});

export default emergencyMode;