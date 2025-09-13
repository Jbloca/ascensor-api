const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        message: 'Debes proporcionar un token de autenticación'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro_aqui');
    
    // Verificar que el usuario existe en la base de datos
    const result = await query(
      'SELECT id, email, nombre, id_apartamento, piso, numero_apartamento FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El token es válido pero el usuario no existe'
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      nombre: result.rows[0].nombre,
      idApartamento: result.rows[0].id_apartamento,
      piso: result.rows[0].piso,
      numeroApartamento: result.rows[0].numero_apartamento
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, inicia sesión nuevamente'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error verificando autenticación'
    });
  }
};

// Middleware opcional para verificar token (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro_aqui');
    
    const result = await query(
      'SELECT id, email, nombre, id_apartamento, piso, numero_apartamento FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        nombre: result.rows[0].nombre,
        idApartamento: result.rows[0].id_apartamento,
        piso: result.rows[0].piso,
        numeroApartamento: result.rows[0].numero_apartamento
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Función para generar token JWT
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro_aqui',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes estar autenticado'
    });
  }

  // Por ahora, todos los usuarios son considerados administradores
  // En el futuro, puedes agregar un campo 'role' a la tabla usuarios
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  requireAdmin
};
