const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  deleteAccount,
  getUserStats,
  updateProfileValidation,
  handleValidationErrors
} = require('../controllers/userController');

// GET /api/users/profile - Obtener perfil del usuario
router.get('/profile', authenticateToken, getProfile);

// PUT /api/users/update - Actualizar perfil del usuario
router.put('/update', authenticateToken, updateProfileValidation, handleValidationErrors, updateProfile);

// DELETE /api/users/delete - Eliminar cuenta del usuario
router.delete('/delete', authenticateToken, deleteAccount);

// GET /api/users/stats - Obtener estadísticas del usuario
router.get('/stats', authenticateToken, getUserStats);

module.exports = router;
