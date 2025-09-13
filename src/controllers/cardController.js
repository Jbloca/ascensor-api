const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validaciones para crear tarjeta
const createCardValidation = [
  body('idApartamento').notEmpty().trim().withMessage('El ID del apartamento es requerido'),
  body('tipoTarjeta').isIn(['A', 'B', 'C']).withMessage('El tipo de tarjeta debe ser A, B o C'),
  body('nombreTarjeta').notEmpty().trim().withMessage('El nombre de la tarjeta es requerido')
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

// GET /api/cards - Obtener todas las tarjetas
const getAllCards = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.id, t.id_apartamento, t.tipo_tarjeta, t.nombre_tarjeta, 
              t.esta_activa, t.ultimo_uso, t.fecha_creacion, t.fecha_actualizacion,
              SUBSTRING(t.id_apartamento FROM 5) as numero_apartamento
       FROM tarjetas t
       ORDER BY t.id_apartamento, t.tipo_tarjeta`
    );

    const tarjetas = result.rows.map(row => ({
      id: row.id,
      idApartamento: row.id_apartamento,
      tipoTarjeta: row.tipo_tarjeta,
      nombreTarjeta: row.nombre_tarjeta,
      estaActiva: row.esta_activa,
      ultimoUso: row.ultimo_uso,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
      numeroApartamento: row.numero_apartamento
    }));

    res.json({
      message: 'Tarjetas obtenidas exitosamente',
      tarjetas,
      total: tarjetas.length
    });

  } catch (error) {
    console.error('Error obteniendo tarjetas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener tarjetas'
    });
  }
};

// GET /api/cards/apartment/:apartmentId - Obtener tarjetas por apartamento
const getCardsByApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;

    const result = await query(
      `SELECT id, tipo_tarjeta, nombre_tarjeta, esta_activa, ultimo_uso, 
              fecha_creacion, fecha_actualizacion
       FROM tarjetas 
       WHERE id_apartamento = $1
       ORDER BY tipo_tarjeta`,
      [apartmentId]
    );

    const tarjetas = result.rows.map(row => ({
      id: row.id,
      idApartamento: apartmentId,
      tipoTarjeta: row.tipo_tarjeta,
      nombreTarjeta: row.nombre_tarjeta,
      estaActiva: row.esta_activa,
      ultimoUso: row.ultimo_uso,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion
    }));

    res.json({
      message: `Tarjetas del apartamento ${apartmentId} obtenidas exitosamente`,
      tarjetas,
      idApartamento: apartmentId,
      total: tarjetas.length
    });

  } catch (error) {
    console.error('Error obteniendo tarjetas por apartamento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener tarjetas del apartamento'
    });
  }
};

// GET /api/cards/:id - Obtener tarjeta por ID
const getCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa, 
              ultimo_uso, fecha_creacion, fecha_actualizacion
       FROM tarjetas 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarjeta no encontrada',
        message: 'La tarjeta no existe'
      });
    }

    const tarjeta = result.rows[0];

    res.json({
      message: 'Tarjeta obtenida exitosamente',
      tarjeta: {
        id: tarjeta.id,
        idApartamento: tarjeta.id_apartamento,
        tipoTarjeta: tarjeta.tipo_tarjeta,
        nombreTarjeta: tarjeta.nombre_tarjeta,
        estaActiva: tarjeta.esta_activa,
        ultimoUso: tarjeta.ultimo_uso,
        fechaCreacion: tarjeta.fecha_creacion,
        fechaActualizacion: tarjeta.fecha_actualizacion
      }
    });

  } catch (error) {
    console.error('Error obteniendo tarjeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener tarjeta'
    });
  }
};

// POST /api/cards - Crear nueva tarjeta
const createCard = async (req, res) => {
  try {
    const { idApartamento, tipoTarjeta, nombreTarjeta } = req.body;

    // Verificar si ya existe una tarjeta del mismo tipo para el apartamento
    const existingCard = await query(
      'SELECT id FROM tarjetas WHERE id_apartamento = $1 AND tipo_tarjeta = $2',
      [idApartamento, tipoTarjeta]
    );

    if (existingCard.rows.length > 0) {
      return res.status(409).json({
        error: 'Tarjeta ya existe',
        message: `Ya existe una tarjeta tipo ${tipoTarjeta} para este apartamento`
      });
    }

    // Crear tarjeta
    const result = await query(
      `INSERT INTO tarjetas (id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa) 
       VALUES ($1, $2, $3, false) 
       RETURNING id, id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa, fecha_creacion`,
      [idApartamento, tipoTarjeta, nombreTarjeta]
    );

    const newCard = result.rows[0];

    res.status(201).json({
      message: 'Tarjeta creada exitosamente',
      tarjeta: {
        id: newCard.id,
        idApartamento: newCard.id_apartamento,
        tipoTarjeta: newCard.tipo_tarjeta,
        nombreTarjeta: newCard.nombre_tarjeta,
        estaActiva: newCard.esta_activa,
        fechaCreacion: newCard.fecha_creacion
      }
    });

  } catch (error) {
    console.error('Error creando tarjeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al crear tarjeta'
    });
  }
};

// PUT /api/cards/:id - Actualizar tarjeta
const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreTarjeta, estaActiva } = req.body;

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombreTarjeta !== undefined) {
      updates.push(`nombre_tarjeta = $${paramCount}`);
      values.push(nombreTarjeta);
      paramCount++;
    }

    if (estaActiva !== undefined) {
      updates.push(`esta_activa = $${paramCount}`);
      values.push(estaActiva);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No hay datos para actualizar',
        message: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    // Agregar fecha de actualización
    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const queryText = `
      UPDATE tarjetas 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa, fecha_actualizacion
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarjeta no encontrada',
        message: 'La tarjeta no existe'
      });
    }

    const updatedCard = result.rows[0];

    res.json({
      message: 'Tarjeta actualizada exitosamente',
      tarjeta: {
        id: updatedCard.id,
        idApartamento: updatedCard.id_apartamento,
        tipoTarjeta: updatedCard.tipo_tarjeta,
        nombreTarjeta: updatedCard.nombre_tarjeta,
        estaActiva: updatedCard.esta_activa,
        fechaActualizacion: updatedCard.fecha_actualizacion
      }
    });

  } catch (error) {
    console.error('Error actualizando tarjeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar tarjeta'
    });
  }
};

// POST /api/cards/:id/activate - Activar tarjeta
const activateCard = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE tarjetas 
       SET esta_activa = true, fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarjeta no encontrada',
        message: 'La tarjeta no existe'
      });
    }

    const card = result.rows[0];

    res.json({
      message: 'Tarjeta activada exitosamente',
      tarjeta: {
        id: card.id,
        idApartamento: card.id_apartamento,
        tipoTarjeta: card.tipo_tarjeta,
        nombreTarjeta: card.nombre_tarjeta,
        estaActiva: card.esta_activa
      }
    });

  } catch (error) {
    console.error('Error activando tarjeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al activar tarjeta'
    });
  }
};

// POST /api/cards/:id/deactivate - Desactivar tarjeta
const deactivateCard = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE tarjetas 
       SET esta_activa = false, fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarjeta no encontrada',
        message: 'La tarjeta no existe'
      });
    }

    const card = result.rows[0];

    res.json({
      message: 'Tarjeta desactivada exitosamente',
      tarjeta: {
        id: card.id,
        idApartamento: card.id_apartamento,
        tipoTarjeta: card.tipo_tarjeta,
        nombreTarjeta: card.nombre_tarjeta,
        estaActiva: card.esta_activa
      }
    });

  } catch (error) {
    console.error('Error desactivando tarjeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al desactivar tarjeta'
    });
  }
};

// DELETE /api/cards/:id - Eliminar tarjeta
const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM tarjetas WHERE id = $1 RETURNING id, id_apartamento, tipo_tarjeta',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarjeta no encontrada',
        message: 'La tarjeta no existe'
      });
    }

    const deletedCard = result.rows[0];

    res.json({
      message: 'Tarjeta eliminada exitosamente',
      tarjeta: {
        id: deletedCard.id,
        idApartamento: deletedCard.id_apartamento,
        tipoTarjeta: deletedCard.tipo_tarjeta
      }
    });

  } catch (error) {
    console.error('Error eliminando tarjeta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar tarjeta'
    });
  }
};

module.exports = {
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
};
