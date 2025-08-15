import React from 'react';

const WorkerList = ({ workers, onWorkerSelect, selectedWorker }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mitarbeiter-Übersicht</h3>
      <div className="space-y-3">
        {workers.map(worker => (
          <div 
            key={worker.id} 
            className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
              selectedWorker?.id === worker.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => onWorkerSelect(worker)}
          >
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-3 ${worker.status === 'aktiv' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <p className="font-medium">{worker.name}</p>
                <p className="text-sm text-gray-500">{worker.currentRoute}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{worker.workTime}</p>
              <p className="text-xs text-gray-500">Update: {worker.lastUpdate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default WorkerList;