const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validaciones para registro
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().trim().withMessage('El nombre es requerido'),
  body('idApartamento').notEmpty().trim().withMessage('El ID del apartamento es requerido')
];

// Validaciones para login
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('contrasena').notEmpty().withMessage('La contraseña es requerida')
];

// Función para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Error de validación',
      details: errors.array()
    });
  }
  next();
};

// Controlador de login
const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    // Buscar usuario en la base de datos
    const result = await query(
      'SELECT id, email, hash_contrasena, nombre, id_apartamento, piso, numero_apartamento FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(contrasena, user.hash_contrasena);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = generateToken(user.id, user.email);

    // Respuesta exitosa
    res.json({
      message: 'Inicio de sesión exitoso',
      usuario: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        idApartamento: user.id_apartamento,
        piso: user.piso,
        numeroApartamento: user.numero_apartamento
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al iniciar sesión'
    });
  }
};

// Controlador de registro
const register = async (req, res) => {
  try {
    const { email, contrasena, nombre, idApartamento } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const hashContrasena = await bcrypt.hash(contrasena, saltRounds);

    // Extraer piso y número de apartamento del ID
    const apartamentoMatch = idApartamento.match(/apt-(\d)(\d+)/);
    if (!apartamentoMatch) {
      return res.status(400).json({
        error: 'ID de apartamento inválido',
        message: 'El formato debe ser apt-XXX (ej: apt-201)'
      });
    }

    const piso = parseInt(apartamentoMatch[1]);
    const numeroApartamento = apartamentoMatch[1] + apartamentoMatch[2];

    // Crear usuario
    const result = await query(
      `INSERT INTO usuarios (email, hash_contrasena, nombre, id_apartamento, piso, numero_apartamento) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, nombre, id_apartamento, piso, numero_apartamento`,
      [email, hashContrasena, nombre, idApartamento, piso, numeroApartamento]
    );

    const newUser = result.rows[0];

    // Generar token JWT
    const token = generateToken(newUser.id, newUser.email);

    // Crear tarjetas por defecto para el apartamento
    await query(
      `INSERT INTO tarjetas (id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa) 
       VALUES ($1, 'A', 'Tarjeta Principal', true),
              ($2, 'B', 'Tarjeta Secundaria', false),
              ($3, 'C', 'Tarjeta de Invitados', false)`,
      [idApartamento, idApartamento, idApartamento]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        idApartamento: newUser.id_apartamento,
        piso: newUser.piso,
        numeroApartamento: newUser.numero_apartamento
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al registrar usuario'
    });
  }
};

// Controlador de logout (principalmente para logging)
const logout = async (req, res) => {
  try {
    // En un sistema JWT, el logout se maneja principalmente en el cliente
    // Aquí podemos registrar el evento para auditoría
    console.log(`Usuario ${req.user?.email} cerró sesión`);
    
    res.json({
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al cerrar sesión'
    });
  }
};

// Controlador para refrescar token
const refreshToken = async (req, res) => {
  try {
    const { userId, email } = req.user;
    
    // Generar nuevo token
    const newToken = generateToken(userId, email);
    
    res.json({
      message: 'Token refrescado exitosamente',
      token: newToken
    });
  } catch (error) {
    console.error('Error refrescando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al refrescar token'
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  refreshToken,
  registerValidation,
  loginValidation,
  handleValidationErrors
};
