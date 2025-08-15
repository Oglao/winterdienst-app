import React, { useState } from 'react';
import './index.css';

// Sehr einfache App ohne komplexe Dependencies
const SimpleApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);

  // Einfache Login-Funktion
  const handleLogin = (username) => {
    setUser({ name: username });
  };

  // Navigation Handler - sehr einfach
  const navigateTo = (page) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
  };

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">Winterdienst App</h1>
          <p className="text-gray-600 mb-6 text-center">Vereinfachte Version</p>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('Max Müller')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Als Max Müller anmelden
            </button>
            <button
              onClick={() => handleLogin('Anna Schmidt')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Als Anna Schmidt anmelden
            </button>
            <button
              onClick={() => handleLogin('Admin')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Als Admin anmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App Content
  const renderContent = () => {
    switch(currentPage) {
      case 'dashboard':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800">Aktive Mitarbeiter</h3>
                <p className="text-2xl font-bold text-blue-600">3</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800">Abgeschlossene Routen</h3>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800">Geplante Routen</h3>
                <p className="text-2xl font-bold text-yellow-600">5</p>
              </div>
            </div>
          </div>
        );
        
      case 'routen':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Routen-Übersicht</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-bold">Hauptstraße Nord</h3>
                <p className="text-gray-600">Status: In Arbeit - Max Müller</p>
                <p className="text-sm text-gray-500">Startzeit: 06:00</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold">Industriegebiet Süd</h3>
                <p className="text-gray-600">Status: Geplant - Anna Schmidt</p>
                <p className="text-sm text-gray-500">Startzeit: 07:00</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-bold">Wohngebiet West</h3>
                <p className="text-gray-600">Status: Abgeschlossen - Peter Wagner</p>
                <p className="text-sm text-gray-500">Abgeschlossen: 10:30</p>
              </div>
            </div>
          </div>
        );
        
      case 'mitarbeiter':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Mitarbeiter</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">Max Müller</h3>
                  <p className="text-gray-600">Hauptstraße Nord</p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Aktiv</span>
              </div>
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">Anna Schmidt</h3>
                  <p className="text-gray-600">Industriegebiet Süd</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">Bereit</span>
              </div>
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">Peter Wagner</h3>
                  <p className="text-gray-600">Pause</p>
                </div>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">Pause</span>
              </div>
            </div>
          </div>
        );
        
      case 'karte':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Karten-Ansicht (Vereinfacht)</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-gray-600">Vereinfachte Kartenansicht</p>
                <p className="text-sm text-gray-500">Hamburg Gebiet - Alle Mitarbeiter aktiv</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl">📍</div>
                <p className="text-sm font-medium">Max Müller</p>
                <p className="text-xs text-gray-600">Hauptstraße</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl">📍</div>
                <p className="text-sm font-medium">Anna Schmidt</p>
                <p className="text-xs text-gray-600">Industriegebiet</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl">📍</div>
                <p className="text-sm font-medium">Peter Wagner</p>
                <p className="text-xs text-gray-600">Wohngebiet</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Seite nicht gefunden</h2>
            <p className="text-gray-600">Diese Seite existiert nicht.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold">Winterdienst Manager (Vereinfacht)</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Angemeldet als: {user.name}</span>
              <button
                onClick={() => setUser(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => navigateTo('routen')}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  currentPage === 'routen' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🛣️ Routen
              </button>
              <button
                onClick={() => navigateTo('mitarbeiter')}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  currentPage === 'mitarbeiter' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                👥 Mitarbeiter
              </button>
              <button
                onClick={() => navigateTo('karte')}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  currentPage === 'karte' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🗺️ Karte
              </button>
            </nav>
            
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800 font-medium">✅ Vereinfachte Version</p>
              <p className="text-xs text-green-600">Navigation funktioniert</p>
              <p className="text-xs text-green-600">Aktuelle Seite: {currentPage}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;