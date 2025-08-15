// src/components/Tracking/TimeTracker.js
import React from 'react';
import { Camera, Play, Pause, Square } from 'lucide-react';
import PhotoCapture from './PhotoCapture';
import { useAppContext } from '../../context/AppContext';

const TimeTracker = () => {
  const { 
    isTracking, 
    setIsTracking, 
    workTime, 
    setWorkTime, 
    formatTime,
    photos,
    handlePhotoCapture 
  } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Arbeitszeit-Tracking</h3>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {formatTime(workTime)}
          </div>
          <p className="text-gray-500">Aktuelle Arbeitszeit</p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isTracking ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isTracking ? 'Pausieren' : 'Starten'}
          </button>
          
          <button
            onClick={() => {
              setIsTracking(false);
              setWorkTime(0);
            }}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
          >
            <Square className="h-4 w-4 mr-2" />
            Stoppen
          </button>
        </div>
      </div>
      
      <PhotoCapture 
        photos={photos} 
        onPhotoCapture={handlePhotoCapture}
        currentLocation={null}
      />
    </div>
  );
};

export default TimeTracker;
