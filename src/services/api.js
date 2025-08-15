import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request Interceptor für Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor für Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // User Management
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Route Management
  getRoutes: () => api.get('/routes'),
  createRoute: (routeData) => api.post('/routes', routeData),
  updateRoute: (id, routeData) => api.put(`/routes/${id}`, routeData),
  deleteRoute: (id) => api.delete(`/routes/${id}`),

  // Tracking
  startWorkSession: (data) => api.post('/tracking/start', data),
  updateLocation: (data) => api.post('/tracking/location', data),
  stopWorkSession: (data) => api.post('/tracking/stop', data),

  // Photos
  uploadPhoto: (formData) => api.post('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPhotos: (sessionId) => api.get(`/photos/${sessionId}`)
};

export default api;