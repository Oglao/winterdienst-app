export const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  export const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };
  
  export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius der Erde in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distanz in km
  };
  
  export const getStatusColor = (status) => {
    const colors = {
      'geplant': 'yellow',
      'in_arbeit': 'blue',
      'abgeschlossen': 'green',
      'abgebrochen': 'red'
    };
    return colors[status] || 'gray';
  };
  
  export const getPriorityColor = (priority) => {
    const colors = {
      'niedrig': 'green',
      'mittel': 'yellow',
      'hoch': 'orange',
      'kritisch': 'red'
    };
    return colors[priority] || 'gray';
  };
  

  