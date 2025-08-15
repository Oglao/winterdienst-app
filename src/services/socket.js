import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(url = process.env.REACT_APP_SOCKET_URL) {
    if (!this.socket) {
      this.socket = io(url, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket verbunden:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket getrennt');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket Verbindungsfehler:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Speichere Listener für Cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Entferne aus gespeicherten Listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  joinWorkerRoom(workerId) {
    this.emit(SOCKET_EVENTS.JOIN_ROOM, workerId);
  }

  updateLocation(locationData) {
    this.emit(SOCKET_EVENTS.LOCATION_UPDATE, locationData);
  }

  updateRouteStatus(routeData) {
    this.emit(SOCKET_EVENTS.ROUTE_STATUS_UPDATE, routeData);
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

export const socketService = new SocketService();
