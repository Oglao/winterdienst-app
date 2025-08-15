import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  QrCode, 
  Mic, 
  Package, 
  Brain, 
  Zap, 
  Camera, 
  MapPin, 
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

const EnhancedDashboard = () => {
  const { 
    workers, 
    routes, 
    workLog, 
    photos, 
    voiceNotes, 
    materialScans,
    openQRScanner, 
    setShowVoiceRecorder, 
    setShowBarcodeScanner,
    setActiveTab
  } = useAppContext();
  const { currentUser } = useAuth();

  // Schnelle Aktionen für alle Benutzer
  const quickActions = [
    {
      id: 'scan-route',
      label: 'Route scannen',
      icon: QrCode,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => openQRScanner('route'),
      description: 'QR-Code einer Route scannen'
    },
    {
      id: 'scan-vehicle',
      label: 'Fahrzeug scannen',
      icon: QrCode,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => openQRScanner('vehicle'),
      description: 'Fahrzeug QR-Code scannen'
    },
    {
      id: 'voice-note',
      label: 'Sprachnotiz',
      icon: Mic,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => setShowVoiceRecorder(true),
      description: 'Sprachnotiz aufnehmen'
    },
    {
      id: 'scan-material',
      label: 'Material scannen',
      icon: Package,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => setShowBarcodeScanner(true),
      description: 'Barcode von Material scannen'
    }
  ];

  // Erweiterte Features für Manager
  const managerActions = [
    {
      id: 'ai-weather',
      label: 'KI-Wetter',
      icon: Brain,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => setActiveTab('ai-weather'),
      description: 'KI-Wettervorhersage anzeigen'
    },
    {
      id: 'route-optimizer',
      label: 'Route optimieren',
      icon: Zap,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      action: () => setActiveTab('route-optimizer'),
      description: 'Automatische Routenoptimierung'
    }
  ];

  // Statistiken berechnen
  const stats = {
    activeWorkers: workers.filter(w => w.status === 'aktiv').length,
    totalRoutes: routes.length,
    completedRoutes: routes.filter(r => r.status === 'abgeschlossen').length,
    recentPhotos: photos.length,
    voiceNotesCount: voiceNotes?.length || 0,
    materialScansCount: materialScans?.length || 0,
    todayActivities: workLog.filter(log => {
      const today = new Date().toLocaleDateString('de-DE');
      return log.timestamp.includes(today);
    }).length
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const ActionButton = ({ action, className = "" }) => (
    <button
      onClick={action.action}
      className={`${action.color} text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center space-y-2 w-full ${className}`}
    >
      <action.icon className="w-8 h-8" />
      <span className="font-semibold">{action.label}</span>
      <span className="text-xs opacity-90 text-center">{action.description}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Willkommen zurück, {currentUser?.name || 'Benutzer'}! 👋
        </h1>
        <p className="opacity-90">
          Heute ist {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Schnelle Aktionen */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Schnelle Aktionen</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <ActionButton key={action.id} action={action} />
          ))}
        </div>
      </div>

      {/* Manager Aktionen */}
      {currentUser?.role !== 'worker' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🧠 KI-Features</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {managerActions.map(action => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Live-Statistiken */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Live-Übersicht</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Aktive Mitarbeiter"
            value={stats.activeWorkers}
            subtitle={`von ${workers.length} gesamt`}
            icon={Users}
            color="bg-green-500"
          />
          <StatCard
            title="Routen heute"
            value={`${stats.completedRoutes}/${stats.totalRoutes}`}
            subtitle="abgeschlossen"
            icon={MapPin}
            color="bg-blue-500"
          />
          <StatCard
            title="Aktivitäten heute"
            value={stats.todayActivities}
            subtitle="Protokoll-Einträge"
            icon={TrendingUp}
            color="bg-purple-500"
          />
          <StatCard
            title="Dokumentation"
            value={stats.recentPhotos}
            subtitle="Fotos aufgenommen"
            icon={Camera}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Neue Features Statistiken */}
      {(stats.voiceNotesCount > 0 || stats.materialScansCount > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🆕 Neue Features</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Sprachnotizen"
              value={stats.voiceNotesCount}
              subtitle="aufgenommen"
              icon={Mic}
              color="bg-purple-500"
            />
            <StatCard
              title="Material-Scans"
              value={stats.materialScansCount}
              subtitle="erfasst"
              icon={Package}
              color="bg-orange-500"
            />
          </div>
        </div>
      )}

      {/* Letzte Aktivitäten */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">⚡ Letzte Aktivitäten</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {workLog.slice(-5).reverse().map(entry => (
              <div key={entry.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{entry.action}</p>
                    <p className="text-sm text-gray-600">{entry.location}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-gray-900">{entry.worker}</p>
                    <p className="text-gray-500">{entry.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
            {workLog.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Noch keine Aktivitäten heute
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;