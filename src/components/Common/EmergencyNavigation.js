import React from 'react';
import debugLogger from '../../utils/debugLogger';

const EmergencyNavigation = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: '🏠 Dashboard', safe: true },
    { id: 'routes', label: '🛣️ Routen', safe: true },
    { id: 'tracking', label: '📍 Tracking', safe: true },
    { id: 'photos', label: '📸 Fotos', safe: true },
    { id: 'protocol', label: '📋 Protokoll', safe: true },
    { id: 'map', label: '🗺️ Karte (Einfach)', safe: false }
  ];

  const handleClick = (tabId) => {
    try {
      debugLogger.log('EMERGENCY_NAV', 'Safe navigation to', tabId);
      onTabChange(tabId);
    } catch (error) {
      debugLogger.error('EMERGENCY_NAV', 'Navigation error', error);
      alert(`Navigation zu ${tabId} fehlgeschlagen. Seite wird neu geladen.`);
      window.location.reload();
    }
  };

  return (
    <div className="w-64 flex-shrink-0 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-red-800">🚨 Notfall-Navigation</h3>
        <p className="text-xs text-red-600">Sichere Navigation aktiv</p>
      </div>
      
      <nav className="space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              activeTab === item.id 
                ? 'bg-red-600 text-white' 
                : item.safe 
                  ? 'text-gray-700 hover:bg-red-100' 
                  : 'text-orange-700 hover:bg-orange-100'
            }`}
            type="button"
          >
            {item.label}
            {!item.safe && <span className="text-xs ml-1">(⚠️)</span>}
          </button>
        ))}
      </nav>

      <div className="mt-4 p-2 bg-red-100 rounded text-xs">
        <p className="font-medium text-red-800">Aktuell: {activeTab}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 text-xs text-red-600 underline hover:text-red-800"
        >
          App neu laden
        </button>
      </div>
    </div>
  );
};

export default EmergencyNavigation;