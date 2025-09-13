const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const apartmentRoutes = require('./routes/apartments');
const cardRoutes = require('./routes/cards');
const elevatorRoutes = require('./routes/elevator');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware de seguridad
app.use(helmet());

// Middleware de logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:19006', // Expo web
    'http://localhost:3000',  // Desarrollo local
    'exp://192.168.1.100:8081', // Expo LAN
    'exp://localhost:8081',   // Expo local
    /^exp:\/\/.*\.(192\.168\.|10\.|172\.)/, // Expo LAN patterns
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sistema de Control de Acceso de Ascensores API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/elevator', elevatorRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Control de Acceso de Ascensores',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      apartments: '/api/apartments',
      cards: '/api/cards',
      elevator: '/api/elevator',
      health: '/health'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Token inválido o expirado'
    });
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📱 API disponible en: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Documentación: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;
