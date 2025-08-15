import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RouteCard from './RouteCard';
import RouteForm from './RouteForm';
import { useAppContext } from '../../context/AppContext';

const RouteList = () => {
  const { routes, setRoutes } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const handleSaveRoute = (routeData) => {
    if (editingRoute) {
      // Update existing route
      setRoutes(routes.map(route => 
        route.id === editingRoute.id ? routeData : route
      ));
    } else {
      // Add new route
      setRoutes([...routes, routeData]);
    }
    setEditingRoute(null);
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setShowForm(true);
  };

  const handleDeleteRoute = (routeId) => {
    if (window.confirm('Route wirklich löschen?')) {
      setRoutes(routes.filter(route => route.id !== routeId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Tour-Planung</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Tour
        </button>
      </div>
      
      {routes.map(route => (
        <RouteCard 
          key={route.id} 
          route={route} 
          onEdit={handleEditRoute}
          onDelete={handleDeleteRoute}
        />
      ))}

      <RouteForm 
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingRoute(null);
        }}
        onSave={handleSaveRoute}
        route={editingRoute}
      />
    </div>
  );
};

export default RouteList;