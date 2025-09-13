const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validaciones para crear apartamento
const createApartmentValidation = [
  body('piso').isInt({ min: 1, max: 50 }).withMessage('El piso debe ser un número entre 1 y 50'),
  body('numero').notEmpty().trim().withMessage('El número de apartamento es requerido')
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

// GET /api/apartments - Obtener todos los apartamentos
const getAllApartments = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.id, a.piso, a.numero, a.fecha_creacion, a.fecha_actualizacion,
              COUNT(t.id) as total_tarjetas,
              COUNT(CASE WHEN t.esta_activa = true THEN 1 END) as tarjetas_activas
       FROM apartamentos a
       LEFT JOIN tarjetas t ON a.numero = SUBSTRING(t.id_apartamento FROM 5)
       GROUP BY a.id, a.piso, a.numero, a.fecha_creacion, a.fecha_actualizacion
       ORDER BY a.piso, a.numero`
    );

    const apartamentos = result.rows.map(row => ({
      id: row.id,
      piso: row.piso,
      numero: row.numero,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
      estadisticas: {
        totalTarjetas: parseInt(row.total_tarjetas),
        tarjetasActivas: parseInt(row.tarjetas_activas)
      }
    }));

    res.json({
      message: 'Apartamentos obtenidos exitosamente',
      apartamentos,
      total: apartamentos.length
    });

  } catch (error) {
    console.error('Error obteniendo apartamentos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener apartamentos'
    });
  }
};

// GET /api/apartments/floor/:floor - Obtener apartamentos por piso
const getApartmentsByFloor = async (req, res) => {
  try {
    const { floor } = req.params;
    const piso = parseInt(floor);

    if (isNaN(piso) || piso < 1) {
      return res.status(400).json({
        error: 'Piso inválido',
        message: 'El piso debe ser un número positivo'
      });
    }

    const result = await query(
      `SELECT a.id, a.piso, a.numero, a.fecha_creacion, a.fecha_actualizacion,
              COUNT(t.id) as total_tarjetas,
              COUNT(CASE WHEN t.esta_activa = true THEN 1 END) as tarjetas_activas
       FROM apartamentos a
       LEFT JOIN tarjetas t ON a.numero = SUBSTRING(t.id_apartamento FROM 5)
       WHERE a.piso = $1
       GROUP BY a.id, a.piso, a.numero, a.fecha_creacion, a.fecha_actualizacion
       ORDER BY a.numero`,
      [piso]
    );

    const apartamentos = result.rows.map(row => ({
      id: row.id,
      piso: row.piso,
      numero: row.numero,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion,
      estadisticas: {
        totalTarjetas: parseInt(row.total_tarjetas),
        tarjetasActivas: parseInt(row.tarjetas_activas)
      }
    }));

    res.json({
      message: `Apartamentos del piso ${piso} obtenidos exitosamente`,
      apartamentos,
      piso,
      total: apartamentos.length
    });

  } catch (error) {
    console.error('Error obteniendo apartamentos por piso:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener apartamentos del piso'
    });
  }
};

// GET /api/apartments/:id - Obtener apartamento por ID
const getApartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.id, a.piso, a.numero, a.fecha_creacion, a.fecha_actualizacion,
              COUNT(t.id) as total_tarjetas,
              COUNT(CASE WHEN t.esta_activa = true THEN 1 END) as tarjetas_activas
       FROM apartamentos a
       LEFT JOIN tarjetas t ON a.numero = SUBSTRING(t.id_apartamento FROM 5)
       WHERE a.id = $1
       GROUP BY a.id, a.piso, a.numero, a.fecha_creacion, a.fecha_actualizacion`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Apartamento no encontrado',
        message: 'El apartamento no existe'
      });
    }

    const apartamento = result.rows[0];

    // Obtener tarjetas del apartamento
    const tarjetasResult = await query(
      `SELECT id, tipo_tarjeta, nombre_tarjeta, esta_activa, ultimo_uso, 
              fecha_creacion, fecha_actualizacion
       FROM tarjetas 
       WHERE id_apartamento = $1
       ORDER BY tipo_tarjeta`,
      [`apt-${apartamento.numero}`]
    );

    const tarjetas = tarjetasResult.rows.map(tarjeta => ({
      id: tarjeta.id,
      tipoTarjeta: tarjeta.tipo_tarjeta,
      nombreTarjeta: tarjeta.nombre_tarjeta,
      estaActiva: tarjeta.esta_activa,
      ultimoUso: tarjeta.ultimo_uso,
      fechaCreacion: tarjeta.fecha_creacion,
      fechaActualizacion: tarjeta.fecha_actualizacion
    }));

    res.json({
      message: 'Apartamento obtenido exitosamente',
      apartamento: {
        id: apartamento.id,
        piso: apartamento.piso,
        numero: apartamento.numero,
        fechaCreacion: apartamento.fecha_creacion,
        fechaActualizacion: apartamento.fecha_actualizacion,
        estadisticas: {
          totalTarjetas: parseInt(apartamento.total_tarjetas),
          tarjetasActivas: parseInt(apartamento.tarjetas_activas)
        },
        tarjetas
      }
    });

  } catch (error) {
    console.error('Error obteniendo apartamento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener apartamento'
    });
  }
};

// POST /api/apartments - Crear nuevo apartamento
const createApartment = async (req, res) => {
  try {
    const { piso, numero } = req.body;

    // Verificar si el apartamento ya existe
    const existingApartment = await query(
      'SELECT id FROM apartamentos WHERE piso = $1 AND numero = $2',
      [piso, numero]
    );

    if (existingApartment.rows.length > 0) {
      return res.status(409).json({
        error: 'Apartamento ya existe',
        message: 'Ya existe un apartamento con este piso y número'
      });
    }

    // Crear apartamento
    const result = await query(
      `INSERT INTO apartamentos (piso, numero) 
       VALUES ($1, $2) 
       RETURNING id, piso, numero, fecha_creacion, fecha_actualizacion`,
      [piso, numero]
    );

    const newApartment = result.rows[0];

    // Crear tarjetas por defecto para el apartamento
    const idApartamento = `apt-${numero}`;
    await query(
      `INSERT INTO tarjetas (id_apartamento, tipo_tarjeta, nombre_tarjeta, esta_activa) 
       VALUES ($1, 'A', 'Tarjeta Principal', true),
              ($2, 'B', 'Tarjeta Secundaria', false),
              ($3, 'C', 'Tarjeta de Invitados', false)`,
      [idApartamento, idApartamento, idApartamento]
    );

    res.status(201).json({
      message: 'Apartamento creado exitosamente',
      apartamento: {
        id: newApartment.id,
        piso: newApartment.piso,
        numero: newApartment.numero,
        fechaCreacion: newApartment.fecha_creacion,
        fechaActualizacion: newApartment.fecha_actualizacion
      }
    });

  } catch (error) {
    console.error('Error creando apartamento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al crear apartamento'
    });
  }
};

// PUT /api/apartments/:id - Actualizar apartamento
const updateApartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { piso, numero } = req.body;

    // Verificar si el apartamento existe
    const existingApartment = await query(
      'SELECT id FROM apartamentos WHERE id = $1',
      [id]
    );

    if (existingApartment.rows.length === 0) {
      return res.status(404).json({
        error: 'Apartamento no encontrado',
        message: 'El apartamento no existe'
      });
    }

    // Verificar si ya existe otro apartamento con el mismo piso y número
    if (piso && numero) {
      const duplicateApartment = await query(
        'SELECT id FROM apartamentos WHERE piso = $1 AND numero = $2 AND id != $3',
        [piso, numero, id]
      );

      if (duplicateApartment.rows.length > 0) {
        return res.status(409).json({
          error: 'Apartamento duplicado',
          message: 'Ya existe otro apartamento con este piso y número'
        });
      }
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (piso) {
      updates.push(`piso = $${paramCount}`);
      values.push(piso);
      paramCount++;
    }

    if (numero) {
      updates.push(`numero = $${paramCount}`);
      values.push(numero);
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
      UPDATE apartamentos 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, piso, numero, fecha_actualizacion
    `;

    const result = await query(queryText, values);

    res.json({
      message: 'Apartamento actualizado exitosamente',
      apartamento: {
        id: result.rows[0].id,
        piso: result.rows[0].piso,
        numero: result.rows[0].numero,
        fechaActualizacion: result.rows[0].fecha_actualizacion
      }
    });

  } catch (error) {
    console.error('Error actualizando apartamento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar apartamento'
    });
  }
};

// DELETE /api/apartments/:id - Eliminar apartamento
const deleteApartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el apartamento existe
    const existingApartment = await query(
      'SELECT numero FROM apartamentos WHERE id = $1',
      [id]
    );

    if (existingApartment.rows.length === 0) {
      return res.status(404).json({
        error: 'Apartamento no encontrado',
        message: 'El apartamento no existe'
      });
    }

    const numeroApartamento = existingApartment.rows[0].numero;
    const idApartamento = `apt-${numeroApartamento}`;

    // Eliminar tarjetas del apartamento
    await query(
      'DELETE FROM tarjetas WHERE id_apartamento = $1',
      [idApartamento]
    );

    // Eliminar comandos del ascensor del apartamento
    await query(
      'DELETE FROM comandos_ascensor WHERE numero_apartamento = $1',
      [numeroApartamento]
    );

    // Eliminar apartamento
    await query(
      'DELETE FROM apartamentos WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Apartamento eliminado exitosamente',
      numeroApartamento
    });

  } catch (error) {
    console.error('Error eliminando apartamento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar apartamento'
    });
  }
};

module.exports = {
  getAllApartments,
  getApartmentsByFloor,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
  createApartmentValidation,
  handleValidationErrors
};
