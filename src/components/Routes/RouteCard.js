import React from 'react';
import { Edit, Trash2, MapPin } from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';
import { useAppContext } from '../../context/AppContext';

const RouteCard = ({ route, onEdit, onDelete }) => {
  const { updateRouteStatus, setActiveTab } = useAppContext();

  const handleShowOnMap = () => {
    // Wechsle zur Karten-Ansicht und fokussiere auf diese Route
    setActiveTab('map');
    
    // Speichere die gewählte Route im localStorage für die Karte
    localStorage.setItem('selectedRoute', JSON.stringify(route));
    
    // Sende Event für die Karten-Komponente
    window.dispatchEvent(new CustomEvent('showRoute', { 
      detail: { route } 
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
          <p className="text-sm text-gray-500">Mitarbeiter: {route.assignedWorker || 'Nicht zugewiesen'}</p>
          {route.description && (
            <p className="text-sm text-gray-600 mt-1">{route.description}</p>
          )}
        </div>
        <div className="flex space-x-2 ml-4">
          <StatusBadge status={route.status} />
          <StatusBadge status={route.priority} type="priority" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Startzeit</p>
          <p className="font-medium">{route.startTime}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Geschätzte Dauer</p>
          <p className="font-medium">{route.estimatedDuration}</p>
        </div>
      </div>

      {route.coordinates && route.coordinates.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Route-Punkte</p>
          <p className="text-xs text-gray-600">{route.coordinates.length} Koordinaten definiert</p>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {route.status === 'geplant' && (
            <button 
              onClick={() => updateRouteStatus(route.id, 'in_arbeit')}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Starten
            </button>
          )}
          {route.status === 'in_arbeit' && (
            <button 
              onClick={() => updateRouteStatus(route.id, 'abgeschlossen')}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Abschließen
            </button>
          )}
          <button 
            onClick={handleShowOnMap}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center"
          >
            <MapPin className="h-3 w-3 mr-1" />
            Auf Karte anzeigen
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(route)}
            className="text-gray-600 hover:text-blue-600 p-1"
            title="Bearbeiten"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(route.id)}
            className="text-gray-600 hover:text-red-600 p-1"
            title="Löschen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;