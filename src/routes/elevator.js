const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  sendCommand,
  getElevatorStatus,
  getElevatorLogs,
  getElevatorStats,
  sendCommandValidation,
  handleValidationErrors
} = require('../controllers/elevatorController');

// POST /api/elevator/command - Enviar comando al ascensor
router.post('/command', authenticateToken, sendCommandValidation, handleValidationErrors, sendCommand);

// GET /api/elevator/status - Obtener estado del ascensor
router.get('/status', authenticateToken, getElevatorStatus);

// GET /api/elevator/logs - Obtener registros de comandos
router.get('/logs', authenticateToken, getElevatorLogs);

// GET /api/elevator/stats - Obtener estadísticas detalladas
router.get('/stats', authenticateToken, getElevatorStats);

module.exports = router;
