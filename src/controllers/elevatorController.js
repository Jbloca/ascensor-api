const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validaciones para enviar comando
const sendCommandValidation = [
  body('numeroApartamento').notEmpty().trim().withMessage('El número de apartamento es requerido'),
  body('tipoTarjeta').isIn(['A', 'B', 'C']).withMessage('El tipo de tarjeta debe ser A, B o C'),
  body('accion').isIn(['ENCENDER', 'APAGAR']).withMessage('La acción debe ser ENCENDER o APAGAR')
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

// POST /api/elevator/command - Enviar comando al ascensor
const sendCommand = async (req, res) => {
  try {
    const { numeroApartamento, tipoTarjeta, accion } = req.body;

    // Verificar que la tarjeta existe y está activa
    const tarjetaResult = await query(
      `SELECT id, esta_activa 
       FROM tarjetas 
       WHERE id_apartamento = $1 AND tipo_tarjeta = $2`,
      [`apt-${numeroApartamento}`, tipoTarjeta]
    );

    if (tarjetaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Tarjeta no encontrada',
        message: `No existe una tarjeta tipo ${tipoTarjeta} para el apartamento ${numeroApartamento}`
      });
    }

    const tarjeta = tarjetaResult.rows[0];

    if (!tarjeta.esta_activa) {
      return res.status(400).json({
        error: 'Tarjeta inactiva',
        message: `La tarjeta tipo ${tipoTarjeta} del apartamento ${numeroApartamento} está inactiva`
      });
    }

    // Registrar comando en la base de datos
    const comandoResult = await query(
      `INSERT INTO comandos_ascensor (numero_apartamento, tipo_tarjeta, accion, exito) 
       VALUES ($1, $2, $3, true) 
       RETURNING id, fecha_hora`,
      [numeroApartamento, tipoTarjeta, accion]
    );

    // Actualizar último uso de la tarjeta
    await query(
      `UPDATE tarjetas 
       SET ultimo_uso = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [tarjeta.id]
    );

    const comando = comandoResult.rows[0];

    // Simular envío del comando al ascensor
    // En una implementación real, aquí enviarías el comando vía Bluetooth o API del ascensor
    console.log(`🎯 Comando enviado al ascensor: ${numeroApartamento}-${tipoTarjeta}-${accion}`);

    res.json({
      message: 'Comando enviado exitosamente al ascensor',
      exito: true,
      comando: {
        id: comando.id,
        numeroApartamento,
        tipoTarjeta,
        accion,
        fechaHora: comando.fecha_hora,
        exito: true
      }
    });

  } catch (error) {
    console.error('Error enviando comando:', error);
    
    // Registrar comando fallido
    try {
      await query(
        `INSERT INTO comandos_ascensor (numero_apartamento, tipo_tarjeta, accion, exito) 
         VALUES ($1, $2, $3, false)`,
        [req.body.numeroApartamento, req.body.tipoTarjeta, req.body.accion]
      );
    } catch (logError) {
      console.error('Error registrando comando fallido:', logError);
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al enviar comando al ascensor'
    });
  }
};

// GET /api/elevator/status - Obtener estado del ascensor
const getElevatorStatus = async (req, res) => {
  try {
    // Obtener último comando
    const ultimoComandoResult = await query(
      `SELECT numero_apartamento, tipo_tarjeta, accion, fecha_hora, exito
       FROM comandos_ascensor 
       ORDER BY fecha_hora DESC 
       LIMIT 1`
    );

    // Obtener estadísticas de comandos
    const estadisticasResult = await query(
      `SELECT 
         COUNT(*) as total_comandos,
         COUNT(CASE WHEN exito = true THEN 1 END) as comandos_exitosos,
         COUNT(CASE WHEN fecha_hora >= CURRENT_DATE THEN 1 END) as comandos_hoy,
         COUNT(CASE WHEN fecha_hora >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as comandos_semana
       FROM comandos_ascensor`
    );

    const estadisticas = estadisticasResult.rows[0];
    const ultimoComando = ultimoComandoResult.rows[0];

    res.json({
      message: 'Estado del ascensor obtenido exitosamente',
      conectado: true, // En una implementación real, verificarías la conexión Bluetooth
      ultimoComando: ultimoComando ? {
        numeroApartamento: ultimoComando.numero_apartamento,
        tipoTarjeta: ultimoComando.tipo_tarjeta,
        accion: ultimoComando.accion,
        fechaHora: ultimoComando.fecha_hora,
        exito: ultimoComando.exito
      } : null,
      estadisticas: {
        totalComandos: parseInt(estadisticas.total_comandos),
        comandosExitosos: parseInt(estadisticas.comandos_exitosos),
        comandosHoy: parseInt(estadisticas.comandos_hoy),
        comandosSemana: parseInt(estadisticas.comandos_semana)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estado del ascensor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener estado del ascensor'
    });
  }
};

// GET /api/elevator/logs - Obtener registros de comandos
const getElevatorLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0, apartamento, fechaDesde, fechaHasta } = req.query;

    // Construir query dinámicamente
    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (apartamento) {
      whereClause += ` WHERE numero_apartamento = $${paramCount}`;
      values.push(apartamento);
      paramCount++;
    }

    if (fechaDesde) {
      const operator = whereClause ? 'AND' : 'WHERE';
      whereClause += ` ${operator} fecha_hora >= $${paramCount}`;
      values.push(fechaDesde);
      paramCount++;
    }

    if (fechaHasta) {
      const operator = whereClause ? 'AND' : 'WHERE';
      whereClause += ` ${operator} fecha_hora <= $${paramCount}`;
      values.push(fechaHasta);
      paramCount++;
    }

    // Agregar límite y offset
    values.push(parseInt(limit), parseInt(offset));

    const queryText = `
      SELECT id, numero_apartamento, tipo_tarjeta, accion, fecha_hora, exito
      FROM comandos_ascensor
      ${whereClause}
      ORDER BY fecha_hora DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await query(queryText, values);

    // Obtener total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comandos_ascensor
      ${whereClause}
    `;
    const countResult = await query(countQuery, values.slice(0, -2));

    const comandos = result.rows.map(row => ({
      id: row.id,
      numeroApartamento: row.numero_apartamento,
      tipoTarjeta: row.tipo_tarjeta,
      accion: row.accion,
      fechaHora: row.fecha_hora,
      exito: row.exito
    }));

    res.json({
      message: 'Registros de comandos obtenidos exitosamente',
      comandos,
      paginacion: {
        total: parseInt(countResult.rows[0].total),
        limite: parseInt(limit),
        offset: parseInt(offset),
        pagina: Math.floor(parseInt(offset) / parseInt(limit)) + 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo registros de comandos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener registros de comandos'
    });
  }
};

// GET /api/elevator/stats - Obtener estadísticas detalladas
const getElevatorStats = async (req, res) => {
  try {
    const { periodo = '7' } = req.query; // días por defecto

    // Estadísticas por apartamento
    const statsPorApartamento = await query(
      `SELECT 
         numero_apartamento,
         COUNT(*) as total_comandos,
         COUNT(CASE WHEN exito = true THEN 1 END) as comandos_exitosos,
         COUNT(CASE WHEN fecha_hora >= CURRENT_DATE - INTERVAL '${periodo} days' THEN 1 END) as comandos_periodo
       FROM comandos_ascensor
       WHERE fecha_hora >= CURRENT_DATE - INTERVAL '${periodo} days'
       GROUP BY numero_apartamento
       ORDER BY total_comandos DESC`
    );

    // Estadísticas por tipo de tarjeta
    const statsPorTarjeta = await query(
      `SELECT 
         tipo_tarjeta,
         COUNT(*) as total_comandos,
         COUNT(CASE WHEN exito = true THEN 1 END) as comandos_exitosos
       FROM comandos_ascensor
       WHERE fecha_hora >= CURRENT_DATE - INTERVAL '${periodo} days'
       GROUP BY tipo_tarjeta
       ORDER BY tipo_tarjeta`
    );

    // Estadísticas por día
    const statsPorDia = await query(
      `SELECT 
         DATE(fecha_hora) as fecha,
         COUNT(*) as total_comandos,
         COUNT(CASE WHEN exito = true THEN 1 END) as comandos_exitosos
       FROM comandos_ascensor
       WHERE fecha_hora >= CURRENT_DATE - INTERVAL '${periodo} days'
       GROUP BY DATE(fecha_hora)
       ORDER BY fecha DESC`
    );

    res.json({
      message: `Estadísticas del ascensor obtenidas exitosamente (últimos ${periodo} días)`,
      periodo: `${periodo} días`,
      estadisticas: {
        porApartamento: statsPorApartamento.rows.map(row => ({
          numeroApartamento: row.numero_apartamento,
          totalComandos: parseInt(row.total_comandos),
          comandosExitosos: parseInt(row.comandos_exitosos),
          comandosPeriodo: parseInt(row.comandos_periodo)
        })),
        porTarjeta: statsPorTarjeta.rows.map(row => ({
          tipoTarjeta: row.tipo_tarjeta,
          totalComandos: parseInt(row.total_comandos),
          comandosExitosos: parseInt(row.comandos_exitosos)
        })),
        porDia: statsPorDia.rows.map(row => ({
          fecha: row.fecha,
          totalComandos: parseInt(row.total_comandos),
          comandosExitosos: parseInt(row.comandos_exitosos)
        }))
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del ascensor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener estadísticas del ascensor'
    });
  }
};

module.exports = {
  sendCommand,
  getElevatorStatus,
  getElevatorLogs,
  getElevatorStats,
  sendCommandValidation,
  handleValidationErrors
};
