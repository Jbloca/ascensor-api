const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  login,
  register,
  logout,
  refreshToken,
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../controllers/authController');

// POST /api/auth/login - Iniciar sesión
router.post('/login', loginValidation, handleValidationErrors, login);

// POST /api/auth/register - Registro de usuario
router.post('/register', registerValidation, handleValidationErrors, register);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, logout);

// POST /api/auth/refresh - Refrescar token
router.post('/refresh', authenticateToken, refreshToken);

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    message: 'Información del usuario actual',
    usuario: req.user
  });
});

module.exports = router;
