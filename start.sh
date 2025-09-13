#!/bin/bash

# Script de inicio para el backend API
echo "🚀 Iniciando Backend API del Sistema de Control de Acceso de Ascensores"
echo "=================================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "📦 Instalando Node.js..."
    # En macOS con Homebrew
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo "💡 Instala Node.js desde https://nodejs.org/"
        exit 1
    fi
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "⚙️  Creando archivo de configuración..."
    cp env.example .env
    echo "✅ Archivo .env creado. Revisa la configuración si es necesario."
fi

# Verificar conexión a la base de datos
echo "🔌 Verificando conexión a la base de datos..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'dpg-d32rcvvdiees7391vld0-a',
  port: 5432,
  database: 'app_ascensor',
  user: 'app_ascensor_user',
  password: 'VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conexión a la base de datos exitosa');
    pool.end();
  }
});
"

if [ $? -eq 0 ]; then
    echo "🎯 Iniciando servidor..."
    echo "📱 API disponible en: http://localhost:3000"
    echo "🏥 Health check: http://localhost:3000/health"
    echo "📚 Documentación: http://localhost:3000/"
    echo ""
    echo "Presiona Ctrl+C para detener el servidor"
    echo "=========================================="
    
    # Iniciar servidor
    npm run dev
else
    echo "❌ No se pudo conectar a la base de datos"
    echo "💡 Verifica que la base de datos esté ejecutándose y las credenciales sean correctas"
    exit 1
fi
