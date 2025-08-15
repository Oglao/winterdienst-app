import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import debugLogger from '../../utils/debugLogger';

const Navigation = () => {
  const { activeTab, setActiveTab } = useAppContext();
  const { currentUser, canManageRoutes } = useAuth();

  // Base navigation items for all users
  const baseNavItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tracking', label: 'Meine Arbeitszeit' },
    { id: 'photos', label: 'Meine Fotos' },
    { id: 'weather', label: 'Wetter' }
  ];

  // Navigation items only for supervisors/admins
  const managerNavItems = [
    { id: 'routes', label: 'Tour-Planung' },
    { id: 'route-optimizer', label: 'KI-Routenoptimierung' },
    { id: 'map', label: 'Team-Karte' },
    { id: 'fixed-openstreetmap', label: 'Live GPS-Tracking' },
    { id: 'vehicles', label: 'Fahrzeuge' },
    { id: 'materials', label: 'Salzverbrauch' },
    { id: 'ai-weather', label: 'KI-Wettervorhersage' },
    { id: 'customers', label: 'Kunden' },
    { id: 'analytics', label: 'Auswertungen' },
    { id: 'protocol', label: 'Arbeitsprotokoll' }
  ];

  // Admin-only items
  const adminNavItems = [
    { id: 'user-management', label: 'Benutzerverwaltung' }
  ];

  // Build navigation based on user role
  let navItems = [...baseNavItems];
  
  if (canManageRoutes()) {
    navItems = [...navItems, ...managerNavItems];
  }
  
  if (currentUser?.role === 'admin') {
    navItems = [...navItems, ...adminNavItems];
  }

  const handleNavClick = (tabId) => {
    try {
      debugLogger.log('NAV', 'Navigation clicked', tabId);
      console.log('🔄 Navigating to:', tabId);
      
      // Use setTimeout to prevent blocking
      setTimeout(() => {
        try {
          setActiveTab(tabId);
          debugLogger.success('NAV', 'Navigation successful', tabId);
          console.log('✅ Navigation completed:', tabId);
        } catch (error) {
          debugLogger.error('NAV', 'Navigation error (async)', error);
          console.error('❌ Navigation failed:', error);
        }
      }, 0);
    } catch (error) {
      debugLogger.error('NAV', 'Navigation error (sync)', error);
      console.error('❌ Navigation click error:', error);
    }
  };

  return (
    <div className="w-64 flex-shrink-0">
      <nav className="space-y-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === item.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      
      {/* Debug Info */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        <p className="font-medium">Aktiver Tab: {activeTab}</p>
        <p className="text-gray-600">Rolle: {currentUser?.role || 'Unbekannt'}</p>
        <p className="text-gray-600">{navItems.length} Menü-Einträge</p>
      </div>
    </div>
  );
};

export default Navigation;