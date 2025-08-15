export const ROUTE_STATUS = {
    PLANNED: 'geplant',
    IN_PROGRESS: 'in_arbeit',
    COMPLETED: 'abgeschlossen',
    CANCELLED: 'abgebrochen'
  };
  
  export const PRIORITY_LEVELS = {
    LOW: 'niedrig',
    MEDIUM: 'mittel',
    HIGH: 'hoch',
    CRITICAL: 'kritisch'
  };
  
  export const WORKER_STATUS = {
    ACTIVE: 'aktiv',
    BREAK: 'pause',
    OFFLINE: 'offline'
  };
  
  export const API_ENDPOINTS = {
    USERS: '/users',
    ROUTES: '/routes',
    TRACKING: '/tracking',
    PHOTOS: '/photos'
  };
  
  export const SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_ROOM: 'join-room',
    LOCATION_UPDATE: 'location-update',
    ROUTE_STATUS_UPDATE: 'route-status-update',
    WORKER_LOCATION_UPDATE: 'worker-location-update',
    ROUTE_STATUS_CHANGED: 'route-status-changed',
    WORK_SESSION_STARTED: 'work-session-started',
    WORK_SESSION_ENDED: 'work-session-ended',
    PHOTO_UPLOADED: 'photo-uploaded'
  };
  
  export const DEFAULT_MAP_CENTER = [53.5511, 9.9937]; // Hamburg
  export const DEFAULT_MAP_ZOOM = 12;
  
  export const WEATHER_CONDITIONS = {
    CLEAR: 'klar',
    CLOUDY: 'bewölkt',
    RAIN: 'regen',
    SNOW: 'schnee',
    STORM: 'sturm'
  };