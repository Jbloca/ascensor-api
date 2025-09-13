# 🏢 Backend API - Sistema de Control de Acceso de Ascensores

## 📋 Descripción

Backend API desarrollado con Node.js y Express para el sistema de control de acceso de ascensores. Proporciona endpoints RESTful para autenticación, gestión de usuarios, apartamentos, tarjetas y comandos del ascensor.

## 🚀 Características

- ✅ **Autenticación JWT** con bcrypt para seguridad
- ✅ **Base de datos PostgreSQL** en Render
- ✅ **Validación de datos** con express-validator
- ✅ **Rate limiting** para prevenir abuso
- ✅ **CORS configurado** para React Native
- ✅ **Logging completo** con Morgan
- ✅ **Manejo de errores** centralizado
- ✅ **Documentación API** integrada

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación
- **helmet** - Seguridad
- **cors** - CORS
- **morgan** - Logging

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── app.js                 # Aplicación principal
│   ├── config/
│   │   └── database.js        # Configuración de BD
│   ├── controllers/
│   │   ├── authController.js  # Controlador de autenticación
│   │   ├── userController.js  # Controlador de usuarios
│   │   ├── apartmentController.js # Controlador de apartamentos
│   │   ├── cardController.js  # Controlador de tarjetas
│   │   └── elevatorController.js # Controlador del ascensor
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticación
│   └── routes/
│       ├── auth.js           # Rutas de autenticación
│       ├── users.js          # Rutas de usuarios
│       ├── apartments.js     # Rutas de apartamentos
│       ├── cards.js          # Rutas de tarjetas
│       └── elevator.js       # Rutas del ascensor
├── package.json              # Dependencias
└── env.example              # Variables de entorno
```

## 🔧 Instalación

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables según tu configuración
nano .env
```

### 3. Configurar base de datos
```bash
# Ejecutar script SQL en tu base de datos PostgreSQL
psql postgresql://app_ascensor_user:VQQgvyuuFDGECleKIB4Xtdxf54MWxP7t@dpg-d32rcvvdiees7391vld0-a:5432/app_ascensor -f ../database_setup.sql
```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📚 API Endpoints

### 🔐 Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token
- `GET /api/auth/me` - Información del usuario actual

### 👤 Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/update` - Actualizar perfil
- `DELETE /api/users/delete` - Eliminar cuenta
- `GET /api/users/stats` - Estadísticas del usuario

### 🏠 Apartamentos
- `GET /api/apartments` - Listar apartamentos
- `GET /api/apartments/floor/:floor` - Apartamentos por piso
- `GET /api/apartments/:id` - Obtener apartamento
- `POST /api/apartments` - Crear apartamento (admin)
- `PUT /api/apartments/:id` - Actualizar apartamento (admin)
- `DELETE /api/apartments/:id` - Eliminar apartamento (admin)

### 🎫 Tarjetas
- `GET /api/cards` - Listar tarjetas
- `GET /api/cards/apartment/:apartmentId` - Tarjetas por apartamento
- `GET /api/cards/:id` - Obtener tarjeta
- `POST /api/cards` - Crear tarjeta (admin)
- `PUT /api/cards/:id` - Actualizar tarjeta
- `POST /api/cards/:id/activate` - Activar tarjeta
- `POST /api/cards/:id/deactivate` - Desactivar tarjeta
- `DELETE /api/cards/:id` - Eliminar tarjeta (admin)

### 🏢 Ascensor
- `POST /api/elevator/command` - Enviar comando
- `GET /api/elevator/status` - Estado del ascensor
- `GET /api/elevator/logs` - Registros de comandos
- `GET /api/elevator/stats` - Estadísticas detalladas

## 🔑 Autenticación

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ascensor.com",
    "contrasena": "admin123"
  }'
```

### Usar token
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 📊 Ejemplos de Uso

### Enviar comando al ascensor
```bash
curl -X POST http://localhost:3000/api/elevator/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "numeroApartamento": "201",
    "tipoTarjeta": "A",
    "accion": "ENCENDER"
  }'
```

### Obtener apartamentos del piso 2
```bash
curl -X GET http://localhost:3000/api/apartments/floor/2 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Activar tarjeta
```bash
curl -X POST http://localhost:3000/api/cards/123/activate \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 🛡️ Seguridad

- **JWT Tokens** con expiración de 7 días
- **Rate limiting** de 100 requests por 15 minutos
- **CORS** configurado para React Native
- **Helmet** para headers de seguridad
- **Validación** de todos los inputs
- **Hash bcrypt** para contraseñas

## 📈 Monitoreo

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
Los logs se muestran en consola con formato combinado de Morgan.

## 🚀 Despliegue en Render

### 1. Conectar repositorio
- Conecta tu repositorio GitHub a Render
- Selecciona "Web Service"

### 2. Configurar build
```bash
# Build Command
npm install

# Start Command
npm start
```

### 3. Variables de entorno
Configura las variables de entorno en Render:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`

## 🔧 Desarrollo

### Estructura de respuestas
```json
{
  "message": "Descripción del resultado",
  "data": { ... },
  "error": "Mensaje de error (si aplica)"
}
```

### Códigos de estado
- `200` - Éxito
- `201` - Creado
- `400` - Error de validación
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `409` - Conflicto
- `500` - Error interno

## 📝 Notas

- La aplicación está configurada para trabajar con la base de datos PostgreSQL de Render
- Los tokens JWT expiran en 7 días por defecto
- El rate limiting está configurado para 100 requests por 15 minutos
- CORS está configurado para React Native y desarrollo web

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.
