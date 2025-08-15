import React, { useState } from 'react';
import { Clock, LogOut, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import emergencyMode from '../../utils/emergencyMode';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [isEmergencyMode, setIsEmergencyMode] = useState(emergencyMode.isEnabled());

  const toggleEmergencyMode = () => {
    if (emergencyMode.isEnabled()) {
      emergencyMode.disable();
      setIsEmergencyMode(false);
      alert('🟢 Normaler Modus aktiviert - App wird neu geladen');
    } else {
      emergencyMode.enable();
      setIsEmergencyMode(true);
      alert('🚨 Notfall-Modus aktiviert - Sichere Navigation');
    }
    window.location.reload();
  };

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 px-6">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Winterdienst Manager</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Emergency Mode Toggle */}
            <button
              onClick={toggleEmergencyMode}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isEmergencyMode 
                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
              title={isEmergencyMode ? 'Notfall-Modus aktiv - Klicken für normalen Modus' : 'Klicken für Notfall-Modus'}
            >
              {isEmergencyMode ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Notfall-Modus
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Normal
                </>
              )}
            </button>

            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {new Date().toLocaleString('de-DE')}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentUser?.name}
              </span>
              <button
                onClick={logout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                title="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;