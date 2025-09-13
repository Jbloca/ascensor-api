const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllCards,
  getCardsByApartment,
  getCardById,
  createCard,
  updateCard,
  activateCard,
  deactivateCard,
  deleteCard,
  createCardValidation,
  handleValidationErrors
} = require('../controllers/cardController');

// GET /api/cards - Obtener todas las tarjetas
router.get('/', authenticateToken, getAllCards);

// GET /api/cards/apartment/:apartmentId - Obtener tarjetas por apartamento
router.get('/apartment/:apartmentId', authenticateToken, getCardsByApartment);

// GET /api/cards/:id - Obtener tarjeta por ID
router.get('/:id', authenticateToken, getCardById);

// POST /api/cards - Crear nueva tarjeta (solo admin)
router.post('/', authenticateToken, requireAdmin, createCardValidation, handleValidationErrors, createCard);

// PUT /api/cards/:id - Actualizar tarjeta
router.put('/:id', authenticateToken, updateCard);

// POST /api/cards/:id/activate - Activar tarjeta
router.post('/:id/activate', authenticateToken, activateCard);

// POST /api/cards/:id/deactivate - Desactivar tarjeta
router.post('/:id/deactivate', authenticateToken, deactivateCard);

// DELETE /api/cards/:id - Eliminar tarjeta (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteCard);

module.exports = router;
