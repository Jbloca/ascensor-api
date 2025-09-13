const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL en Render
const dbConfig = {
  // Usar DATABASE_URL de Render si está disponible, sino usar configuración manual
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_HOST || 'dpg-d32rcvvdiees7391vld0-a.oregon-postgres.render.com',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'app_ascensor',
  user: process.env.DATABASE_USER || 'app_ascensor_user',
  password: process.env.DATABASE_PASSWORD || 'VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000, // timeout de conexión de 2 segundos
};

// Crear pool de conexiones
const pool = new Pool(dbConfig);

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err);
});

// Función para conectar a la base de datos
async function connectDB() {
  try {
    console.log('🔌 Conectando a la base de datos PostgreSQL...');
    
    // Probar conexión
    const client = await pool.connect();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Verificar que las tablas existen
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usuarios', 'apartamentos', 'tarjetas', 'comandos_ascensor')
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('📋 Tablas encontradas:', tables);
    
    if (tables.length < 4) {
      console.log('⚠️  Advertencia: No todas las tablas están creadas');
      console.log('💡 Ejecuta el script database_setup.sql en tu base de datos');
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
}

// Función para ejecutar consultas
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutada:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Error en query:', { text, error: error.message });
    throw error;
  }
}

// Función para obtener un cliente del pool
async function getClient() {
  return await pool.connect();
}

// Función para cerrar el pool
async function closePool() {
  await pool.end();
  console.log('🔌 Pool de conexiones cerrado');
}

// Función para verificar el estado de la base de datos
async function checkDBHealth() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].postgres_version,
      connectionCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

module.exports = {
  connectDB,
  query,
  getClient,
  closePool,
  checkDBHealth,
  pool
};
