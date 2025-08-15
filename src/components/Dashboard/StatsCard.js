import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, isWarning = false }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${isWarning ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
