#!/bin/bash

# Script específico para desplegar API en Render con credenciales reales
echo "🚀 Desplegando API en Render con configuración específica"
echo "========================================================"

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ No estás en el directorio del backend"
    echo "💡 Ejecuta: cd backend"
    exit 1
fi

# Verificar si git está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git add .
    git commit -m "Initial commit: Backend API para Sistema de Control de Acceso de Ascensores"
    echo "✅ Repositorio Git inicializado"
else
    echo "✅ Repositorio Git ya existe"
fi

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Hay cambios sin commitear. Agregando cambios..."
    git add .
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ Cambios commiteados"
else
    echo "✅ No hay cambios pendientes"
fi

# Mostrar estado del repositorio
echo ""
echo "📊 Estado del repositorio:"
git status --short

echo ""
echo "🔑 Configuración específica para Render:"
echo "JWT_SECRET=OY\$QCST0xNm^X7!koN^rjVxaeO!71J"
echo "DATABASE_URL=postgresql://app_ascensor_user:VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t@dpg-d32rcvvdiees7391vld0-a:5432/app_ascensor"
echo ""
echo "🌐 IPs estáticas de Render:"
echo "44.226.145.213, 54.187.200.255, 34.213.214.55"
echo "35.164.95.156, 44.230.95.183, 44.229.200.200"
echo ""
echo "🚀 Próximos pasos para desplegar en Render:"
echo "1. Crear repositorio en GitHub:"
echo "   - Ve a https://github.com/new"
echo "   - Nombre: ascensor-api"
echo "   - Crea el repositorio"
echo ""
echo "2. Conectar repositorio local:"
echo "   git remote add origin https://github.com/TU_USUARIO/ascensor-api.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Desplegar en Render:"
echo "   - Ve a https://render.com"
echo "   - New → Web Service"
echo "   - Connect GitHub → Selecciona tu repositorio"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""
echo "4. Configurar variables de entorno en Render:"
echo "   NODE_ENV=production"
echo "   PORT=10000"
echo "   JWT_SECRET=OY\$QCST0xNm^X7!koN^rjVxaeO!71J"
echo "   JWT_EXPIRES_IN=7d"
echo "   DATABASE_URL=postgresql://app_ascensor_user:VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t@dpg-d32rcvvdiees7391vld0-a:5432/app_ascensor"
echo "   CORS_ORIGIN=https://ascensor-api.onrender.com,http://localhost:19006,http://localhost:3000"
echo "   RENDER_STATIC_IPS=44.226.145.213,54.187.200.255,34.213.214.55,35.164.95.156,44.230.95.183,44.229.200.200"
echo "   RATE_LIMIT_WINDOW_MS=900000"
echo "   RATE_LIMIT_MAX_REQUESTS=100"
echo "   LOG_LEVEL=combined"
echo "   RENDER=true"
echo "   RENDER_EXTERNAL_URL=https://ascensor-api.onrender.com"
echo ""
echo "5. Ejecutar script SQL en la base de datos:"
echo "   psql postgresql://app_ascensor_user:VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t@dpg-d32rcvvdiees7391vld0-a:5432/app_ascensor -f ../database_setup.sql"
echo ""
echo "6. Probar API desplegada:"
echo "   curl https://ascensor-api.onrender.com/health"
echo ""
echo "🎯 Tu API estará disponible en: https://ascensor-api.onrender.com"
echo ""
echo "📚 Documentación completa en: GUIA_DESPLEGUE_RENDER.md"
echo "📋 Variables de entorno en: RENDER_ENV_VARS.txt"

# Preguntar si quiere continuar con GitHub
echo ""
read -p "¿Quieres que te ayude a conectar con GitHub? (y/n): " continue_github

if [ "$continue_github" = "y" ] || [ "$continue_github" = "Y" ]; then
    echo ""
    echo "🔗 Para conectar con GitHub:"
    echo "1. Crea el repositorio en GitHub primero"
    echo "2. Luego ejecuta estos comandos:"
    echo ""
    echo "git remote add origin https://github.com/TU_USUARIO/ascensor-api.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    echo "💡 Reemplaza 'TU_USUARIO' con tu nombre de usuario de GitHub"
    echo ""
    echo "🎯 Una vez conectado, ve a Render.com y sigue la guía de despliegue"
else
    echo "✅ Listo para desplegar. Sigue los pasos de la guía."
fi

echo ""
echo "🎉 ¡Tu API está lista para Render con todas las credenciales configuradas!"
