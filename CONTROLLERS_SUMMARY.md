# 📚 Resumen de Controllers - Biblioteca Xonler

## 🎯 **Controllers Desarrollados**

### 1. **AuthController** (`src/controllers/auth.controller.js`)
**Propósito**: Autenticación y gestión de usuarios

**Endpoints**:
- `POST /auth/register` - Registro de usuarios (rol por defecto: usuario)
- `POST /auth/login` - Login de usuarios
- `GET /auth/me` - Perfil del usuario autenticado (requiere JWT)
- `POST /auth/refresh` - Renovar token JWT

**Características**:
- ✅ Hash de passwords con bcrypt
- ✅ Generación de JWT tokens
- ✅ Validación de email único
- ✅ Rol por defecto: usuario (ID: 2)

---

### 2. **UsuariosController** (`src/controllers/usuarios.controller.js`)
**Propósito**: Gestión completa de usuarios

**Endpoints**:
- `GET /usuarios` - Listar usuarios (admin, paginado)
- `GET /usuarios/:id` - Obtener usuario por ID
- `POST /usuarios` - Crear usuario (admin)
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario (admin)

**Características**:
- ✅ Filtros por rol, email, ciudad
- ✅ No expone password_hash
- ✅ Validación de email único
- ✅ Gestión de preferencias (JSONB)

---

### 3. **RolesController** (`src/controllers/roles.controller.js`)
**Propósito**: Gestión de roles del sistema

**Endpoints**:
- `GET /roles` - Listar todos los roles
- `GET /roles/:id` - Obtener rol por ID
- `POST /roles` - Crear nuevo rol (admin)
- `PUT /roles/:id` - Actualizar rol (admin)
- `DELETE /roles/:id` - Eliminar rol (admin, con protección)

**Características**:
- ✅ Protección contra eliminación si hay usuarios asignados
- ✅ Validación de nombre único
- ✅ Ordenamiento alfabético

---

### 4. **ColegiosController** (`src/controllers/colegios.controller.js`)
**Propósito**: Gestión de colegios/instituciones

**Endpoints**:
- `GET /colegios` - Listar colegios con filtros
- `GET /colegios/:id` - Obtener colegio por ID
- `POST /colegios` - Crear colegio (admin)
- `PUT /colegios/:id` - Actualizar colegio (admin)
- `DELETE /colegios/:id` - Eliminar colegio (admin, con protección)

**Características**:
- ✅ Filtros por nombre y dirección
- ✅ Paginación
- ✅ Protección contra eliminación si tiene bibliotecas
- ✅ Búsqueda con ILIKE (case-insensitive)

---

### 5. **BibliotecasController** (`src/controllers/bibliotecas.controller.js`)
**Propósito**: Gestión de bibliotecas por colegio

**Endpoints**:
- `GET /bibliotecas` - Listar bibliotecas con filtros
- `GET /bibliotecas/:id` - Obtener biblioteca por ID
- `GET /bibliotecas/:id/libros` - Catálogo de libros por biblioteca
- `POST /bibliotecas` - Crear biblioteca (admin)
- `PUT /bibliotecas/:id` - Actualizar biblioteca (admin)
- `DELETE /bibliotecas/:id` - Eliminar biblioteca (admin, con protección)

**Características**:
- ✅ Filtros por colegio y nombre
- ✅ Catálogo especial con disponibilidad en tiempo real
- ✅ Protección contra eliminación si tiene libros o préstamos
- ✅ JOIN con colegios para información completa

---

### 6. **LibrosController** (`src/controllers/libros.controller.js`)
**Propósito**: Gestión del catálogo de libros

**Endpoints**:
- `GET /libros` - Búsqueda global de libros
- `GET /libros/:id` - Obtener libro por ID
- `POST /libros` - Crear libro (admin)
- `PUT /libros/:id` - Actualizar libro (admin)
- `DELETE /libros/:id` - Eliminar libro (admin, con protección)
- `POST /libros/:id/imagen` - Subir imagen del libro (multer)

**Características**:
- ✅ Búsqueda por texto, categoría, autor
- ✅ Filtro de disponibilidad en tiempo real
- ✅ Validación de ISBN único
- ✅ Categoría por defecto: "Otros"
- ✅ Soporte para imágenes con multer
- ✅ Conteo de ejemplares y disponibilidad

---

### 7. **BibliotecaLibrosController** (`src/controllers/biblioteca-libros.controller.js`)
**Propósito**: Gestión de ejemplares (relación biblioteca-libro)

**Endpoints**:
- `GET /biblioteca-libros` - Listar ejemplares con filtros
- `GET /biblioteca-libros/:id` - Obtener ejemplar por ID
- `POST /biblioteca-libros` - Asignar libro a biblioteca (admin)
- `DELETE /biblioteca-libros/:id` - Eliminar ejemplar (admin, con protección)
- `GET /biblioteca-libros/:id/disponibilidad` - Verificar disponibilidad

**Características**:
- ✅ Unicidad (biblioteca_id, libro_id)
- ✅ Verificación de disponibilidad en tiempo real
- ✅ Historial de préstamos por ejemplar
- ✅ Protección contra eliminación si tiene préstamos activos
- ✅ Fecha estimada de devolución

---

### 8. **PrestamosController** (`src/controllers/prestamos.controller.js`)
**Propósito**: Core del negocio - gestión de préstamos

**Endpoints**:
- `GET /prestamos` - Listar préstamos con filtros (admin)
- `GET /prestamos/:id` - Obtener préstamo por ID
- `POST /prestamos` - Crear préstamo (auth requerido)
- `POST /prestamos/:id/devolucion` - Marcar devolución
- `POST /prestamos/:id/renovar` - Renovar préstamo
- `GET /prestamos/usuario/actual` - Préstamos del usuario logueado

**Características**:
- ✅ Verificación de disponibilidad antes de prestar
- ✅ Prevención de múltiples préstamos del mismo ejemplar
- ✅ Plazo de 15 días por defecto
- ✅ Renovación de préstamos (solo si no está vencido)
- ✅ Permisos: usuario solo puede devolver sus propios préstamos
- ✅ Filtros por usuario, biblioteca, estado activo, fechas
- ✅ Fecha de vencimiento calculada automáticamente

---

## 🔐 **Sistema de Autenticación**

### **JWT Token Structure**:
```json
{
  "id": "user_id",
  "email": "user@email.com",
  "rol": "usuario|admin|bibliotecario",
  "rol_id": 1|2|3
}
```

### **Validaciones de Seguridad**:
- ✅ Passwords hasheados con bcrypt
- ✅ Tokens JWT con expiración de 24h
- ✅ Middleware de autenticación requerido
- ✅ Verificación de roles para operaciones admin
- ✅ Protección de recursos por propietario

---

## 📊 **Características Comunes**

### **Paginación**:
- Parámetros: `limit` (default: 50), `offset` (default: 0)
- Respuesta incluye: `total`, `limit`, `offset`

### **Filtros Dinámicos**:
- Construcción automática de WHERE clauses
- Parámetros preparados para prevenir SQL injection
- Búsquedas case-insensitive con ILIKE

### **Manejo de Errores**:
- ✅ Códigos HTTP apropiados (400, 401, 403, 404, 409, 500)
- ✅ Mensajes de error descriptivos
- ✅ Logging de errores en consola
- ✅ Validaciones de integridad referencial

### **Integridad de Datos**:
- ✅ Verificación de existencia antes de operaciones
- ✅ Protección contra eliminación de entidades relacionadas
- ✅ Validación de unicidad (email, ISBN, combinaciones)
- ✅ Triggers automáticos para `updated_at`

---

## 🚀 **Próximos Pasos**

1. **Crear las rutas** para cada controller
2. **Implementar middleware de autenticación**
3. **Configurar middleware de autorización por roles**
4. **Crear validaciones de entrada** (Joi, express-validator)
5. **Implementar tests unitarios**
6. **Documentar API** (Swagger/OpenAPI)

---

## 📝 **Notas de Implementación**

- **Base de datos**: Todos los controllers usan el pool de conexiones PostgreSQL
- **Transacciones**: Considerar implementar transacciones para operaciones complejas
- **Cache**: Evaluar implementación de Redis para consultas frecuentes
- **Logging**: Implementar sistema de logging estructurado
- **Métricas**: Agregar métricas de performance y uso
