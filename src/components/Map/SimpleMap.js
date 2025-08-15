import React, { useState } from 'react';
import { MapPin, Users, Navigation } from 'lucide-react';
import debugLogger from '../../utils/debugLogger';

const SimpleMap = ({ workers, routes }) => {
  const [selectedWorker, setSelectedWorker] = useState(null);

  const handleWorkerClick = (worker) => {
    debugLogger.log('SIMPLE_MAP', 'Worker selected', worker.name);
    setSelectedWorker(worker);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Karten-Übersicht (Vereinfacht)
        </h3>
        <div className="text-sm text-gray-500">
          Hamburg Gebiet
        </div>
      </div>

      {/* Vereinfachte Karten-Darstellung */}
      <div className="h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
        <div className="text-center">
          <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Vereinfachte Kartenansicht</p>
          <p className="text-xs text-gray-400">Alle Mitarbeiter im Hamburg Gebiet</p>
        </div>
      </div>

      {/* Mitarbeiter Liste */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center mb-3">
          <Users className="h-4 w-4 mr-2" />
          Aktive Mitarbeiter ({workers ? workers.length : 0})
        </h4>
        
        {workers && workers.length > 0 ? (
          workers.map(worker => (
            <div
              key={worker.id}
              onClick={() => handleWorkerClick(worker)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedWorker?.id === worker.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    worker.status === 'aktiv' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{worker.name}</p>
                    <p className="text-sm text-gray-600">{worker.currentRoute}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{worker.workTime}</p>
                  <p className="text-xs text-gray-500">{worker.lastUpdate}</p>
                </div>
              </div>
              
              {selectedWorker?.id === worker.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Status:</p>
                      <p className={`font-medium ${
                        worker.status === 'aktiv' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {worker.status === 'aktiv' ? 'Aktiv' : 'Pause'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Position:</p>
                      <p className="font-medium text-gray-900">
                        {worker.position.lat.toFixed(3)}, {worker.position.lng.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Keine Mitarbeiter verfügbar</p>
          </div>
        )}
      </div>

      {/* Routen Übersicht */}
      {routes && routes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Aktive Routen</h4>
          <div className="space-y-2">
            {routes.map(route => (
              <div key={route.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{route.name}</p>
                  <p className="text-sm text-gray-600">{route.assignedWorker}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    route.status === 'geplant' ? 'bg-yellow-100 text-yellow-800' :
                    route.status === 'in_arbeit' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {route.status === 'geplant' ? 'Geplant' :
                     route.status === 'in_arbeit' ? 'In Arbeit' : 'Abgeschlossen'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Dies ist eine vereinfachte Kartenansicht. 
          Klicken Sie auf Mitarbeiter für Details.
        </p>
      </div>
    </div>
  );
};

export default SimpleMap;