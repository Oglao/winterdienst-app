/**
 * Console Protection - Prevents [object GeolocationPositionError] from being logged
 * This is a safe, simple override that only affects display, not functionality
 */

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Safe error message converter
const safeStringify = (arg) => {
  if (typeof arg === 'object' && arg !== null) {
    // Check if it's a GeolocationPositionError
    if (arg.constructor && arg.constructor.name === 'GeolocationPositionError') {
      const userMessage = (() => {
        switch (arg.code) {
          case 1: return 'Standort-Berechtigung verweigert';
          case 2: return 'Standort-Information nicht verfügbar';
          case 3: return 'Standort-Anfrage Timeout';
          default: return 'Unbekannter GPS-Fehler';
        }
      })();
      return `[GPS Error: ${userMessage} (Code: ${arg.code})]`;
    }
    
    // Check for [object SomeClass] toString patterns
    const str = arg.toString();
    if (str.startsWith('[object ') && str.endsWith(']')) {
      try {
        return JSON.stringify(arg);
      } catch {
        return str.replace('[object GeolocationPositionError]', '[GPS Error: Standort-Fehler]');
      }
    }
  }
  
  return arg;
};

// Safe console override
console.error = function(...args) {
  const safeArgs = args.map(safeStringify);
  originalError.apply(console, safeArgs);
};

console.warn = function(...args) {
  const safeArgs = args.map(safeStringify);
  originalWarn.apply(console, safeArgs);
};

console.log = function(...args) {
  const safeArgs = args.map(safeStringify);
  originalLog.apply(console, safeArgs);
};

// Export initialization function
export const initConsoleProtection = () => {
  console.log('🛡️ Console protection initialized - GPS errors will be user-friendly');
};

export default { initConsoleProtection };