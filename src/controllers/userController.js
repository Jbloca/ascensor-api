const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Validaciones para actualizar perfil
const updateProfileValidation = [
  body('nombre').optional().notEmpty().trim().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  body('contrasena').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
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

// GET /api/users/profile - Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, email, nombre, id_apartamento, piso, numero_apartamento, 
              fecha_creacion, fecha_actualizacion 
       FROM usuarios WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe'
      });
    }

    const user = result.rows[0];

    res.json({
      message: 'Perfil obtenido exitosamente',
      usuario: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        idApartamento: user.id_apartamento,
        piso: user.piso,
        numeroApartamento: user.numero_apartamento,
        fechaCreacion: user.fecha_creacion,
        fechaActualizacion: user.fecha_actualizacion
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener perfil'
    });
  }
};

// PUT /api/users/update - Actualizar perfil del usuario
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, email, contrasena } = req.body;

    // Verificar si el email ya existe en otro usuario
    if (email) {
      const existingUser = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Email ya existe',
          message: 'Ya existe otro usuario con este email'
        });
      }
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre) {
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (contrasena) {
      const saltRounds = 12;
      const hashContrasena = await bcrypt.hash(contrasena, saltRounds);
      updates.push(`hash_contrasena = $${paramCount}`);
      values.push(hashContrasena);
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
    values.push(userId);

    const queryText = `
      UPDATE usuarios 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, email, nombre, id_apartamento, piso, numero_apartamento, fecha_actualizacion
    `;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe'
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      message: 'Perfil actualizado exitosamente',
      usuario: {
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre,
        idApartamento: updatedUser.id_apartamento,
        piso: updatedUser.piso,
        numeroApartamento: updatedUser.numero_apartamento,
        fechaActualizacion: updatedUser.fecha_actualizacion
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar perfil'
    });
  }
};

// DELETE /api/users/delete - Eliminar cuenta del usuario
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Eliminar tarjetas del usuario primero
    await query(
      'DELETE FROM tarjetas WHERE id_apartamento = (SELECT id_apartamento FROM usuarios WHERE id = $1)',
      [userId]
    );

    // Eliminar comandos del ascensor del usuario
    await query(
      'DELETE FROM comandos_ascensor WHERE numero_apartamento = (SELECT numero_apartamento FROM usuarios WHERE id = $1)',
      [userId]
    );

    // Eliminar usuario
    const result = await query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe'
      });
    }

    res.json({
      message: 'Cuenta eliminada exitosamente',
      email: result.rows[0].email
    });

  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar cuenta'
    });
  }
};

// GET /api/users/stats - Obtener estadísticas del usuario
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener estadísticas de tarjetas
    const cardStats = await query(
      `SELECT 
         COUNT(*) as total_tarjetas,
         COUNT(CASE WHEN esta_activa = true THEN 1 END) as tarjetas_activas,
         COUNT(CASE WHEN ultimo_uso IS NOT NULL THEN 1 END) as tarjetas_usadas
       FROM tarjetas 
       WHERE id_apartamento = (SELECT id_apartamento FROM usuarios WHERE id = $1)`,
      [userId]
    );

    // Obtener estadísticas de comandos del ascensor
    const commandStats = await query(
      `SELECT 
         COUNT(*) as total_comandos,
         COUNT(CASE WHEN exito = true THEN 1 END) as comandos_exitosos,
         COUNT(CASE WHEN fecha_hora >= CURRENT_DATE THEN 1 END) as comandos_hoy
       FROM comandos_ascensor 
       WHERE numero_apartamento = (SELECT numero_apartamento FROM usuarios WHERE id = $1)`,
      [userId]
    );

    const stats = {
      tarjetas: cardStats.rows[0],
      comandos: commandStats.rows[0]
    };

    res.json({
      message: 'Estadísticas obtenidas exitosamente',
      estadisticas: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener estadísticas'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  getUserStats,
  updateProfileValidation,
  handleValidationErrors
};
