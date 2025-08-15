import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, Clock, MapPin, Award, AlertTriangle } from 'lucide-react';

const PerformanceDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('efficiency');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/performance?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'efficiency':
        return <TrendingUp className="w-5 h-5" />;
      case 'quality':
        return <Award className="w-5 h-5" />;
      case 'speed':
        return <Clock className="w-5 h-5" />;
      case 'coverage':
        return <MapPin className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    return 'D';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Keine Analytics-Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">
            Team-Leistung und Effizienz-Analyse
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
            <option value="year">Letztes Jahr</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktive Mitarbeiter</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview?.active_workers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Routen abgeschlossen</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview?.completed_routes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Durchschn. Effizienz</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview?.avg_efficiency?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gesamtbewertung</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview?.overall_score?.toFixed(1) || 0}/100
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Performance Ranking */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Mitarbeiter-Ranking
          </h3>
          
          <div className="space-y-3">
            {analytics.worker_rankings?.map((worker, index) => (
              <div key={worker.worker_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{worker.worker_name}</p>
                    <p className="text-sm text-gray-600">
                      {worker.completed_routes} Routen • {formatDuration(worker.total_minutes)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getPerformanceColor(worker.performance_score)
                  }`}>
                    {getPerformanceGrade(worker.performance_score)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {worker.performance_score?.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Effizienz-Metriken
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Durchschn. Routenzeit</span>
              </div>
              <span className="text-sm font-bold">
                {formatDuration(analytics.efficiency_metrics?.avg_route_duration || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Routen pro Tag</span>
              </div>
              <span className="text-sm font-bold">
                {analytics.efficiency_metrics?.avg_routes_per_day?.toFixed(1) || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Materialeffizienz</span>
              </div>
              <span className="text-sm font-bold">
                {analytics.efficiency_metrics?.material_efficiency?.toFixed(2) || 0} kg/qm
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Kundenbewertung</span>
              </div>
              <span className="text-sm font-bold">
                {analytics.efficiency_metrics?.avg_customer_rating?.toFixed(1) || 0}/5.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Detaillierte Performance-Daten
          </h3>
          
          <div className="flex space-x-2">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="efficiency">Effizienz</option>
              <option value="quality">Qualität</option>
              <option value="speed">Geschwindigkeit</option>
              <option value="coverage">Abdeckung</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mitarbeiter
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Routen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stunden
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Effizienz
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bewertung
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.detailed_performance?.map((worker) => (
                <tr key={worker.worker_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {worker.worker_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {worker.worker_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {worker.completed_routes}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDuration(worker.total_minutes)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            worker.efficiency_score >= 85 ? 'bg-green-500' :
                            worker.efficiency_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(worker.efficiency_score, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {worker.efficiency_score?.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      getPerformanceColor(worker.performance_score)
                    }`}>
                      {getPerformanceGrade(worker.performance_score)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {worker.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : worker.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 rounded-full" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Performance-Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.insights?.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
              insight.type === 'success' ? 'bg-green-50 border-green-400' :
              insight.type === 'info' ? 'bg-blue-50 border-blue-400' :
              'bg-red-50 border-red-400'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                {insight.type === 'success' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {insight.type === 'info' && <BarChart3 className="w-4 h-4 text-blue-600" />}
                <h4 className="font-medium">{insight.title}</h4>
              </div>
              <p className="text-sm text-gray-600">{insight.description}</p>
              {insight.recommendation && (
                <p className="text-sm font-medium mt-2">
                  Empfehlung: {insight.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;