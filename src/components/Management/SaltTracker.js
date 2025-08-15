import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, BarChart3 } from 'lucide-react';

const SaltTracker = () => {
  const [materials, setMaterials] = useState([]);
  const [usage, setUsage] = useState([]);
  const [usageSummary, setUsageSummary] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [timeRange, setTimeRange] = useState('week');

  const [newUsage, setNewUsage] = useState({
    route_id: '',
    material_id: '',
    amount_used: '',
    area_covered: '',
    weather_condition: '',
    surface_type: 'asphalt',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMaterials(),
        loadUsage(),
        loadUsageSummary(),
        loadLowStockAlerts()
      ]);
    } catch (error) {
      console.error('Error loading salt tracker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    const response = await fetch('/api/materials');
    if (response.ok) {
      const data = await response.json();
      setMaterials(data);
    }
  };

  const loadUsage = async () => {
    let url = '/api/materials/usage';
    if (selectedRoute) {
      url += `?route_id=${selectedRoute}`;
    }
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      setUsage(data);
    }
  };

  const loadUsageSummary = async () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const response = await fetch(`/api/materials/usage-summary?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
    if (response.ok) {
      const data = await response.json();
      setUsageSummary(data);
    }
  };

  const loadLowStockAlerts = async () => {
    const response = await fetch('/api/materials/low-stock-alerts');
    if (response.ok) {
      const data = await response.json();
      setLowStockAlerts(data);
    }
  };

  const handleAddUsage = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/materials/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUsage)
      });

      if (response.ok) {
        setNewUsage({
          route_id: '',
          material_id: '',
          amount_used: '',
          area_covered: '',
          weather_condition: '',
          surface_type: 'asphalt',
          notes: ''
        });
        await loadData();
      } else {
        const error = await response.json();
        alert('Fehler beim Speichern: ' + error.message);
      }
    } catch (error) {
      console.error('Error adding usage:', error);
      alert('Fehler beim Speichern');
    }
  };

  const calculateEfficiency = (usage, area) => {
    if (!usage || !area || area === 0) return 'N/A';
    return (usage / area).toFixed(2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salzverbrauch-Tracking</h1>
          <p className="text-gray-600 mt-1">
            Überwachung und Analyse des Materialverbrauchs
          </p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="week">Letzte Woche</option>
            <option value="month">Letzter Monat</option>
            <option value="quarter">Letztes Quartal</option>
          </select>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">Lagerbestand-Warnungen</h3>
          </div>
          <div className="space-y-1">
            {lowStockAlerts.map((alert) => (
              <p key={alert.id} className="text-sm text-red-700">
                {alert.name}: {alert.current_stock} {alert.unit} 
                (Mindestbestand: {alert.min_stock_alert} {alert.unit})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {usageSummary && usageSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {usageSummary.map((material) => (
            <div key={material.material_name} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{material.material_name}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {parseFloat(material.total_used).toFixed(1)} {material.unit}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {material.usage_count} Einsätze • {parseFloat(material.total_cost).toFixed(2)}€
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Usage Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Verbrauch erfassen
          </h3>
          
          <form onSubmit={handleAddUsage} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <select
                  value={newUsage.material_id}
                  onChange={(e) => setNewUsage(prev => ({ ...prev, material_id: e.target.value }))}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Material auswählen</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verbrauchte Menge
                </label>
                <input
                  type="number"
                  value={newUsage.amount_used}
                  onChange={(e) => setNewUsage(prev => ({ ...prev, amount_used: e.target.value }))}
                  step="0.1"
                  min="0"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="z.B. 50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bearbeitete Fläche (qm)
                </label>
                <input
                  type="number"
                  value={newUsage.area_covered}
                  onChange={(e) => setNewUsage(prev => ({ ...prev, area_covered: e.target.value }))}
                  step="0.1"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="z.B. 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oberflächentyp
                </label>
                <select
                  value={newUsage.surface_type}
                  onChange={(e) => setNewUsage(prev => ({ ...prev, surface_type: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="asphalt">Asphalt</option>
                  <option value="concrete">Beton</option>
                  <option value="paving">Pflaster</option>
                  <option value="gravel">Schotter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wetterbedingungen
              </label>
              <input
                type="text"
                value={newUsage.weather_condition}
                onChange={(e) => setNewUsage(prev => ({ ...prev, weather_condition: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="z.B. -2°C, Schneefall"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notizen
              </label>
              <textarea
                value={newUsage.notes}
                onChange={(e) => setNewUsage(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Zusätzliche Informationen..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Verbrauch erfassen
            </button>
          </form>
        </div>

        {/* Material Inventory */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Materialbestand
          </h3>
          
          <div className="space-y-3">
            {materials.map((material) => {
              const stockPercentage = material.min_stock_alert > 0 
                ? (material.current_stock / material.min_stock_alert) * 100
                : 100;
              const isLowStock = stockPercentage <= 100;
              
              return (
                <div key={material.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                      <p className="text-sm text-gray-600">
                        Aktuell: {material.current_stock} {material.unit}
                      </p>
                    </div>
                    {isLowStock && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        isLowStock ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Mindest: {material.min_stock_alert} {material.unit}</span>
                    <span>{material.cost_per_unit}€/{material.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Usage History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Verbrauchshistorie
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Datum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Route
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Material
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Verbrauch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fläche
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Effizienz
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Wetter
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usage.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {entry.route_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {entry.material_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {entry.amount_used} {entry.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {entry.area_covered ? `${entry.area_covered} qm` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {calculateEfficiency(entry.amount_used, entry.area_covered)} {entry.unit}/qm
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {entry.weather_condition || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {usage.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Verbrauchsdaten vorhanden
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaltTracker;