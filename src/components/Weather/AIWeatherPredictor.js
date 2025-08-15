import React, { useState, useEffect } from 'react';
import { Cloud, CloudSnow, Sun, CloudRain, AlertTriangle, Brain, TrendingUp, Calendar } from 'lucide-react';

const AIWeatherPredictor = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workloadPrediction, setWorkloadPrediction] = useState(null);

  // Simulierte KI-Wettervorhersage (in echter App: ML-API)
  const simulateAIWeatherPrediction = () => {
    const currentDate = new Date();
    const predictions = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      
      // Simulierte Wetterwahrscheinlichkeiten
      const snowChance = Math.random() * 100;
      const temperature = -5 + Math.random() * 15; // -5°C bis 10°C
      const windSpeed = Math.random() * 25; // 0-25 km/h
      const precipitation = Math.random() * 10; // 0-10mm
      
      // KI-Bewertung (vereinfacht)
      let severity = 'niedrig';
      let workloadFactor = 1;
      
      if (snowChance > 70 && temperature < 0) {
        severity = 'hoch';
        workloadFactor = 3;
      } else if (snowChance > 40 || temperature < -2) {
        severity = 'mittel';
        workloadFactor = 2;
      }
      
      predictions.push({
        date: date.toLocaleDateString('de-DE'),
        dayName: date.toLocaleDateString('de-DE', { weekday: 'short' }),
        temperature: Math.round(temperature),
        snowChance: Math.round(snowChance),
        windSpeed: Math.round(windSpeed),
        precipitation: Math.round(precipitation * 10) / 10,
        severity,
        workloadFactor,
        confidence: 85 + Math.random() * 15 // 85-100% Konfidenz
      });
    }
    
    return predictions;
  };

  // Arbeitsbelastung berechnen
  const calculateWorkloadPrediction = (predictions) => {
    const totalWorkload = predictions.reduce((sum, day) => sum + day.workloadFactor, 0);
    const avgWorkload = totalWorkload / predictions.length;
    
    const criticalDays = predictions.filter(day => day.severity === 'hoch').length;
    const moderateDays = predictions.filter(day => day.severity === 'mittel').length;
    
    return {
      totalWorkload,
      avgWorkload,
      criticalDays,
      moderateDays,
      recommendation: getRecommendation(avgWorkload, criticalDays)
    };
  };

  const getRecommendation = (avgWorkload, criticalDays) => {
    if (criticalDays >= 3) {
      return {
        level: 'kritisch',
        text: 'Hohe Arbeitsbelastung erwartet. Zusätzliche Teams bereitstellen.',
        actions: [
          'Extra Salz bestellen',
          'Alle Fahrzeuge überprüfen',
          'Bereitschaftsdienst organisieren',
          'Kunden vorab informieren'
        ]
      };
    } else if (avgWorkload > 2) {
      return {
        level: 'erhöht',
        text: 'Erhöhte Arbeitsbelastung. Normale Vorbereitung verstärken.',
        actions: [
          'Salz-Vorräte prüfen',
          'Fahrzeuge checken',
          'Teams briefen'
        ]
      };
    } else {
      return {
        level: 'normal',
        text: 'Normale Arbeitsbelastung erwartet.',
        actions: [
          'Routinekontrollen durchführen',
          'Wetterentwicklung beobachten'
        ]
      };
    }
  };

  const getWeatherIcon = (snowChance, temperature) => {
    if (snowChance > 60 && temperature < 2) {
      return <CloudSnow className="w-8 h-8 text-blue-600" />;
    } else if (snowChance > 30) {
      return <CloudRain className="w-8 h-8 text-gray-600" />;
    } else if (temperature > 10) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'hoch': return 'bg-red-100 text-red-800 border-red-200';
      case 'mittel': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  useEffect(() => {
    setLoading(true);
    
    // Simuliere API-Aufruf
    setTimeout(() => {
      const predictions = simulateAIWeatherPrediction();
      const workload = calculateWorkloadPrediction(predictions);
      
      setAiPrediction(predictions);
      setWorkloadPrediction(workload);
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
          <h2 className="text-lg font-bold text-gray-900">KI-Wettervorhersage</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">KI analysiert Wetterdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KI-Vorhersage Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">KI-Wettervorhersage</h2>
          </div>
          <div className="text-sm text-gray-500">
            Aktualisiert: {new Date().toLocaleTimeString('de-DE')}
          </div>
        </div>

        {/* Arbeitsbelastung Übersicht */}
        {workloadPrediction && (
          <div className={`p-4 rounded-lg border-2 ${
            workloadPrediction.recommendation.level === 'kritisch' ? 'bg-red-50 border-red-200' :
            workloadPrediction.recommendation.level === 'erhöht' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className={`w-5 h-5 ${
                workloadPrediction.recommendation.level === 'kritisch' ? 'text-red-600' :
                workloadPrediction.recommendation.level === 'erhöht' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
              <span className="font-semibold">7-Tage Arbeitsbelastung</span>
            </div>
            <p className="text-sm mb-3">{workloadPrediction.recommendation.text}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Kritische Tage:</span>
                <span className="ml-2 font-semibold">{workloadPrediction.criticalDays}</span>
              </div>
              <div>
                <span className="text-gray-600">Mittlere Tage:</span>
                <span className="ml-2 font-semibold">{workloadPrediction.moderateDays}</span>
              </div>
              <div>
                <span className="text-gray-600">Ø Belastung:</span>
                <span className="ml-2 font-semibold">{workloadPrediction.avgWorkload.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7-Tage Vorhersage */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">7-Tage Detailvorhersage</h3>
        </div>

        <div className="grid gap-4">
          {aiPrediction && aiPrediction.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-center min-w-16">
                  <div className="text-sm font-medium text-gray-900">{day.dayName}</div>
                  <div className="text-xs text-gray-500">{day.date}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getWeatherIcon(day.snowChance, day.temperature)}
                  <div>
                    <div className="text-lg font-semibold">{day.temperature}°C</div>
                    <div className="text-sm text-gray-600">{day.snowChance}% Schnee</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div>Wind: {day.windSpeed} km/h</div>
                  <div>Niederschlag: {day.precipitation}mm</div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(day.severity)}`}>
                  {day.severity}
                </div>
                
                <div className="text-right text-sm">
                  <div className="font-semibold">{day.workloadFactor}x Arbeit</div>
                  <div className="text-gray-500">{Math.round(day.confidence)}% sicher</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empfehlungen */}
      {workloadPrediction && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">KI-Empfehlungen</h3>
          </div>
          
          <div className="space-y-2">
            {workloadPrediction.recommendation.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWeatherPredictor;