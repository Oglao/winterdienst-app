import React from 'react';

const StatusBadge = ({ status, type = 'status' }) => {
  const getStatusClasses = () => {
    if (type === 'priority') {
      switch(status) {
        case 'hoch': return 'bg-red-100 text-red-800';
        case 'mittel': return 'bg-yellow-100 text-yellow-800';
        case 'niedrig': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch(status) {
        case 'geplant': return 'bg-yellow-100 text-yellow-800';
        case 'in_arbeit': return 'bg-blue-100 text-blue-800';
        case 'abgeschlossen': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const displayText = status === 'in_arbeit' ? 'in Arbeit' : status;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;