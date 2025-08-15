require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./database/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100 // Limit auf 100 requests pro windowMs
});
app.use(limiter);

// Database Connection is initialized in db.js

// Socket.IO für Real-time Updates
io.on('connection', (socket) => {
  console.log('Benutzer verbunden:', socket.id);
  
  socket.on('join-room', (workerId) => {
    socket.join(`worker-${workerId}`);
  });
  
  socket.on('location-update', (data) => {
    socket.broadcast.emit('worker-location-update', data);
  });
  
  socket.on('route-status-update', (data) => {
    io.emit('route-status-changed', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Benutzer getrennt:', socket.id);
  });
});

// Middleware für Socket.IO in Routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth')); // Public auth routes (register, login)
app.use('/api/users', require('./routes/users'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/map', require('./routes/map'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/gps-tracking', require('./routes/gps-tracking'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Interner Serverfehler' });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected' 
  });
});

// Basic route für Debugging
app.get('/', (req, res) => {
  res.json({ 
    message: 'Winterdienst API Server', 
    status: 'running',
    endpoints: ['/health', '/api/users', '/api/routes', '/api/photos']
  });
});

// 404 Handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route nicht gefunden' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});