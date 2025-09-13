const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllApartments,
  getApartmentsByFloor,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
  createApartmentValidation,
  handleValidationErrors
} = require('../controllers/apartmentController');

// GET /api/apartments - Obtener todos los apartamentos
router.get('/', authenticateToken, getAllApartments);

// GET /api/apartments/floor/:floor - Obtener apartamentos por piso
router.get('/floor/:floor', authenticateToken, getApartmentsByFloor);

// GET /api/apartments/:id - Obtener apartamento por ID
router.get('/:id', authenticateToken, getApartmentById);

// POST /api/apartments - Crear nuevo apartamento (solo admin)
router.post('/', authenticateToken, requireAdmin, createApartmentValidation, handleValidationErrors, createApartment);

// PUT /api/apartments/:id - Actualizar apartamento (solo admin)
router.put('/:id', authenticateToken, requireAdmin, updateApartment);

// DELETE /api/apartments/:id - Eliminar apartamento (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteApartment);

module.exports = router;
