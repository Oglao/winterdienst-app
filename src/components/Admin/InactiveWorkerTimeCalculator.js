import React, { useState, useEffect } from 'react';
import { Clock, Calculator, Users, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import automaticTimeTrackingService from '../../services/automaticTimeTracking';

const InactiveWorkerTimeCalculator = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculations, setCalculations] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Demo workers data (in real app this would come from database)
  const demoWorkers = [
    {
      id: 'worker-1',
      name: 'Max Müller',
      hasActiveTracking: false,
      schedule: 'fulltime',
      lastActive: '2025-01-25',
      department: 'Straßenreinigung'
    },
    {
      id: 'worker-2',
      name: 'Anna Schmidt',
      hasActiveTracking: true,
      schedule: 'fulltime',
      lastActive: '2025-01-27',
      department: 'Salzstreuung'
    },
    {
      id: 'worker-3',
      name: 'Peter Wagner',
      hasActiveTracking: false,
      schedule: 'parttime',
      lastActive: '2025-01-24',
      department: 'Gehwegreinigung'
    },
    {
      id: 'worker-4',
      name: 'Lisa Schultz',
      hasActiveTracking: false,
      schedule: 'fulltime',
      lastActive: '2025-01-26',
      department: 'Straßenreinigung'
    },
    {
      id: 'worker-5',
      name: 'Tom Fischer',
      hasActiveTracking: true,
      schedule: 'parttime',
      lastActive: '2025-01-27',
      department: 'Salzstreuung'
    }
  ];

  useEffect(() => {
    setWorkers(demoWorkers);
  }, []);

  const calculateAllInactiveWorkers = async () => {
    setIsCalculating(true);
    const selectedDateObj = new Date(selectedDate);
    const newCalculations = [];

    try {
      // Get inactive workers (those without active tracking)
      const inactiveWorkers = workers.filter(worker => !worker.hasActiveTracking);

      for (const worker of inactiveWorkers) {
        const calculation = automaticTimeTrackingService.calculateInactiveWorkerTime(
          worker.id,
          selectedDateObj
        );

        // Add additional context
        const enhancedCalculation = {
          ...calculation,
          workerName: worker.name,
          department: worker.department,
          schedule: worker.schedule,
          lastActive: worker.lastActive,
          calculatedAt: new Date()
        };

        newCalculations.push(enhancedCalculation);
      }

      setCalculations(newCalculations);
      console.log('✅ Time calculations completed for inactive workers');

    } catch (error) {
      console.error('❌ Failed to calculate worker times:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0h 0min';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    return `${hours}h ${minutes % 60}min`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'Hoch';
    if (confidence >= 0.6) return 'Mittel';
    return 'Niedrig';
  };

  const getTotalEstimatedTime = () => {
    return calculations.reduce((total, calc) => total + calc.estimatedWorkTime, 0);
  };

  const getActiveWorkersCount = () => {
    return workers.filter(worker => worker.hasActiveTracking).length;
  };

  const getInactiveWorkersCount = () => {
    return workers.filter(worker => !worker.hasActiveTracking).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zeitberechnung für inaktive Mitarbeiter</h1>
          <p className="text-gray-600">
            Automatische Berechnung der Arbeitszeit für Mitarbeiter ohne aktives GPS-Tracking
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Mitarbeiter</p>
              <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Aktives Tracking</p>
              <p className="text-2xl font-bold text-green-600">{getActiveWorkersCount()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <Calculator className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Berechnung nötig</p>
              <p className="text-2xl font-bold text-orange-600">{getInactiveWorkersCount()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Geschätzte Zeit</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(getTotalEstimatedTime())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Zeitberechnung durchführen</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Datum:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={calculateAllInactiveWorkers}
              disabled={isCalculating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              <span>{isCalculating ? 'Berechnet...' : 'Zeit berechnen'}</span>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            Diese Funktion berechnet die Arbeitszeit für Mitarbeiter, die kein automatisches GPS-Tracking verwenden.
            Die Berechnung basiert auf Schichtplänen, historischen Daten und typischen Arbeitsmustern.
          </p>
        </div>
      </div>

      {/* Workers Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mitarbeiter Übersicht</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abteilung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schichtplan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Letzte Aktivität
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{worker.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {worker.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      worker.hasActiveTracking 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {worker.hasActiveTracking ? 'Aktiv' : 'Berechnung nötig'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {worker.schedule === 'fulltime' ? 'Vollzeit' : 'Teilzeit'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(worker.lastActive).toLocaleDateString('de-DE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Results */}
      {calculations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Berechnungsergebnisse</h2>
          
          <div className="space-y-4">
            {calculations.map((calculation) => (
              <div key={calculation.userId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{calculation.workerName}</h3>
                    <p className="text-sm text-gray-600">{calculation.department}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {formatTime(calculation.estimatedWorkTime)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(calculation.confidence)}`}>
                      {getConfidenceText(calculation.confidence)} Genauigkeit
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Berechnungsmethode:</span>
                    <p className="text-gray-600">{calculation.calculationMethod}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Datum:</span>
                    <p className="text-gray-600">{new Date(calculation.date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Berechnet am:</span>
                    <p className="text-gray-600">{calculation.calculatedAt.toLocaleString('de-DE')}</p>
                  </div>
                </div>

                {calculation.isEstimate && (
                  <div className="mt-3 flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Hinweis:</p>
                      <p>
                        Dies ist eine Schätzung basierend auf dem Schichtplan. Für genauere Zeiten 
                        sollte der Mitarbeiter das automatische GPS-Tracking aktivieren.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Zusammenfassung</h3>
                <p className="text-sm text-blue-800">
                  Geschätzte Gesamtarbeitszeit für {calculations.length} Mitarbeiter am {new Date(selectedDate).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {formatTime(getTotalEstimatedTime())}
                </div>
                <div className="text-sm text-blue-700">Geschätzte Stunden</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Automatische Zeitberechnung für inaktive Mitarbeiter</p>
            <ul className="space-y-1">
              <li>• Für Mitarbeiter ohne GPS-Tracking wird die Zeit automatisch geschätzt</li>
              <li>• Berechnung basiert auf Schichtplänen und historischen Arbeitsmustern</li>
              <li>• Höhere Genauigkeit durch Aktivierung des automatischen Trackings</li>
              <li>• Admin kann manuelle Korrekturen vornehmen</li>
              <li>• Berechnungen werden für Abrechnungszwecke gespeichert</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactiveWorkerTimeCalculator;