import React, { useState, useEffect } from 'react';
import { User, Clock, FileText, Eye, CheckCircle, AlertCircle } from 'lucide-react';

const CustomerPortal = ({ customerId }) => {
  const [customerData, setCustomerData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/status`);
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'abgeschlossen':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_arbeit':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'geplant':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'abgeschlossen':
        return 'bg-green-100 text-green-800';
      case 'in_arbeit':
        return 'bg-blue-100 text-blue-800';
      case 'geplant':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!customerData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kundendaten konnten nicht geladen werden</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customerData.customer.name}
            </h1>
            <p className="text-gray-600">
              {customerData.customer.contact_person && 
                `Ansprechpartner: ${customerData.customer.contact_person}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Aktive Projekte</p>
              <p className="text-lg font-semibold text-gray-900">
                {customerData.total_active_projects}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Letzte Aktivität</p>
              <p className="text-lg font-semibold text-gray-900">
                {customerData.recent_activity_count}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Offene Rechnungen</p>
              <p className="text-lg font-semibold text-gray-900">
                {customerData.pending_invoices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Gesamtstunden</p>
              <p className="text-lg font-semibold text-gray-900">
                {customerData.billing_summary.length > 0 
                  ? customerData.billing_summary[0].total_hours
                  : '0'
                }h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Übersicht', icon: Eye },
              { id: 'activities', name: 'Aktivitäten', icon: Clock },
              { id: 'projects', name: 'Projekte', icon: FileText },
              { id: 'invoices', name: 'Rechnungen', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Status Cards */}
              {customerData.projects.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Aktive Projekte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerData.projects.map((project) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                        <div className="text-xs text-gray-500">
                          Start: {new Date(project.start_date).toLocaleDateString('de-DE')}
                          {project.end_date && (
                            <> • Ende: {new Date(project.end_date).toLocaleDateString('de-DE')}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Summary */}
              {customerData.billing_summary.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Abrechnungsübersicht</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {customerData.billing_summary.map((summary) => (
                      <div key={summary.project_id} className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Gesamtstunden:</span>
                          <p className="font-medium">{summary.total_hours}h</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Routen:</span>
                          <p className="font-medium">{summary.routes_count}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Abgerechnet:</span>
                          <p className="font-medium">{parseFloat(summary.billed_amount).toFixed(2)}€</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Verbleibend:</span>
                          <p className="font-medium">{parseFloat(summary.remaining_value).toFixed(2)}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Letzte Aktivitäten</h3>
              <div className="space-y-3">
                {customerData.recent_sessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(session.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.route_name}</h4>
                          <p className="text-sm text-gray-600">
                            {session.worker_name} • {session.project_name}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatDateTime(session.start_time)}</p>
                          {session.total_duration && (
                            <p>Dauer: {formatDuration(session.total_duration)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {customerData.recent_sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Keine aktuellen Aktivitäten
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Alle Projekte</h3>
              <div className="space-y-4">
                {customerData.projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Startdatum:</span>
                        <p className="font-medium">
                          {new Date(project.start_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Enddatum:</span>
                        <p className="font-medium">
                          {project.end_date 
                            ? new Date(project.end_date).toLocaleDateString('de-DE')
                            : 'Offen'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Vertragswert:</span>
                        <p className="font-medium">
                          {project.contract_value ? `${parseFloat(project.contract_value).toFixed(2)}€` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Abrechnungsart:</span>
                        <p className="font-medium">{project.billing_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Rechnungen</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rechnungsnummer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Datum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fälligkeitsdatum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Betrag
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerData.pending_invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(invoice.due_date).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {parseFloat(invoice.total_amount).toFixed(2)}€
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {customerData.pending_invoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Keine Rechnungen vorhanden
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;