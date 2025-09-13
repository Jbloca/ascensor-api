#!/bin/bash

# Script para desplegar API en Render
echo "🚀 Preparando despliegue de API en Render"
echo "========================================"

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
echo "🌐 Próximos pasos para desplegar en Render:"
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
echo "4. Configurar variables de entorno:"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_cambiar_en_produccion_123456789"
echo "   DATABASE_URL=postgresql://app_ascensor_user:VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t@dpg-d32rcvvdiees7391vld0-a:5432/app_ascensor"
echo ""
echo "5. Ejecutar script SQL en la base de datos:"
echo "   psql postgresql://app_ascensor_user:VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t@dpg-d32rcvvdiees7391vld0-a:5432/app_ascensor -f ../database_setup.sql"
echo ""
echo "🎯 Tu API estará disponible en: https://tu-app-render.onrender.com"
echo ""
echo "📚 Documentación completa en: GUIA_RENDER.md"

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
else
    echo "✅ Listo para desplegar. Sigue los pasos de la guía."
fi
