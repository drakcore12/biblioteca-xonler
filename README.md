# Biblioteca Xonler

Sistema de gestión de bibliotecas escolares desarrollado con Node.js, Express y PostgreSQL.

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Srpino/Biblioteca-Xonler.git
   cd Biblioteca-Xonler
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar PostgreSQL**
   - Instalar PostgreSQL en tu sistema
   - Crear una base de datos llamada `xonler`
   - Ejecutar el script de esquema: `database/schema.sql`

4. **Configuración automática (recomendado)**
   ```bash
   npm run setup
   ```
   Este comando:
   - Crea el archivo `.env` desde `env.example`
   - Prueba la conexión a la base de datos
   - Te guía en caso de errores

5. **Configuración manual (alternativa)**
   Copiar `env.example` a `.env` y configurar:
   ```bash
   cp env.example .env
   ```
   
   Editar `.env` con tus credenciales de PostgreSQL:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=xonler
   DB_USER=tu_usuario_postgres
   DB_PASSWORD=tu_password_postgres
   JWT_SECRET=tu_jwt_secret_super_seguro_aqui
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=http://localhost:3000
   ```

## 🏃‍♂️ Ejecutar

**Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── app.js              # Configuración de Express
├── server.js           # Punto de entrada del servidor
├── config/
│   └── database.js     # Configuración de PostgreSQL
├── controllers/        # Controladores de la lógica de negocio
├── middleware/         # Middlewares personalizados
└── routes/            # Definición de rutas API

public/
├── pages/             # Páginas HTML
├── css/               # Estilos CSS
├── js/                # JavaScript del frontend
└── assets/            # Imágenes y recursos estáticos

database/
└── schema.sql         # Esquema de la base de datos
```

## 🔧 Scripts Disponibles

- `npm start` - Ejecuta el servidor en modo producción
- `npm run dev` - Ejecuta el servidor en modo desarrollo con nodemon
- `npm run setup` - Configuración automática del proyecto
- `npm test` - Ejecuta las pruebas (pendiente de implementar)

## 🌐 Endpoints API

- `GET /api/health` - Estado del servidor
- `POST /api/usuarios` - Gestión de usuarios
- `GET /` - Página principal
- `GET /login` - Página de login
- `GET /contacto` - Página de contacto

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT, bcrypt
- **Frontend**: HTML, CSS, JavaScript vanilla
- **Middleware**: CORS, multer (para archivos)

## 🗄️ Configuración de Base de Datos

### Requisitos
- PostgreSQL 12 o superior
- Usuario con permisos para crear tablas

### Pasos
1. **Crear base de datos:**
   ```sql
   CREATE DATABASE xonler;
   ```

2. **Ejecutar esquema:**
   ```bash
   psql -U tu_usuario -d xonler -f database/schema.sql
   ```

3. **Verificar tablas:**
   ```sql
   \dt
   \d usuarios
   \d roles
   ```

## 📝 Notas

- El proyecto está configurado para usar CommonJS
- Las rutas estáticas se sirven desde la carpeta `public`
- El manejo de errores está implementado globalmente
- Soporte para CORS habilitado
- Pool de conexiones PostgreSQL configurado para mejor rendimiento

## 🚨 Solución de Problemas

### Error: "Cannot find module '../config/database'"
- ✅ **Resuelto**: Se creó el archivo `src/config/database.js`
- ✅ **Resuelto**: Se actualizó el controlador para usar la nueva estructura

### Error de conexión a PostgreSQL
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que la base de datos exista
- Verificar permisos del usuario

### Error de tablas no encontradas
- Ejecutar `database/schema.sql` en la base de datos
- Verificar que las tablas `usuarios` y `roles` existan
