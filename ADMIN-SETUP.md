# Configuración del Panel de Administración de Bibliotecas

## Descripción

Este sistema permite a los administradores de bibliotecas gestionar completamente su biblioteca asignada, incluyendo:

- **Gestión de Libros**: Agregar, remover y administrar libros de su biblioteca
- **Gestión de Préstamos**: Ver, filtrar y marcar préstamos como devueltos
- **Estadísticas**: Análisis detallado del rendimiento de la biblioteca
- **Dashboard**: Vista general con métricas clave

## Estructura de Base de Datos

### Nueva Tabla: `usuario_biblioteca`

```sql
CREATE TABLE public.usuario_biblioteca (
  usuario_id     bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  biblioteca_id  bigint NOT NULL REFERENCES public.bibliotecas(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id),
  UNIQUE (usuario_id)  -- garantiza una sola biblioteca por usuario
);
```

Esta tabla establece una relación uno-a-uno entre administradores y bibliotecas.

## Configuración Inicial

### 1. Ejecutar la migración de base de datos

```bash
# Ejecutar el archivo db.sql actualizado
psql -U tu_usuario -d tu_base_de_datos -f db.sql
```

### 2. Asignar administradores a bibliotecas

```bash
# Listar bibliotecas disponibles
node scripts/assign-admin-to-library.js --list-bibliotecas

# Listar administradores disponibles
node scripts/assign-admin-to-library.js --list-admins

# Asignar administrador a biblioteca
node scripts/assign-admin-to-library.js admin@ejemplo.com 1
```

### 3. Verificar configuración

```bash
# Verificar que el servidor esté funcionando
curl http://localhost:3000/api/health

# Verificar rutas de admin (requiere autenticación)
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:3000/api/admin/biblioteca
```

## API Endpoints

### Autenticación Requerida
Todos los endpoints requieren autenticación con token JWT y rol de 'admin'.

### Información de Biblioteca
- `GET /api/admin/biblioteca` - Obtener información de la biblioteca asignada
- `GET /api/admin/estadisticas` - Obtener estadísticas de la biblioteca

### Gestión de Libros
- `GET /api/admin/libros` - Listar libros de la biblioteca con filtros
- `POST /api/admin/libros` - Agregar libro a la biblioteca
- `DELETE /api/admin/libros/:biblioteca_libro_id` - Remover libro de la biblioteca

### Gestión de Préstamos
- `GET /api/admin/prestamos` - Listar préstamos con filtros
- `PATCH /api/admin/prestamos/:prestamo_id/devolver` - Marcar préstamo como devuelto

## Funcionalidades del Frontend

### Dashboard Principal
- **Estadísticas en tiempo real**: Total de libros, préstamos activos, usuarios únicos
- **Préstamos recientes**: Lista de los últimos préstamos
- **Información de biblioteca**: Detalles de la biblioteca asignada

### Gestión de Libros
- **Lista completa**: Vista paginada de todos los libros en la biblioteca
- **Filtros avanzados**: Por título, autor, categoría, disponibilidad
- **Agregar libros**: Búsqueda y selección de libros del sistema global
- **Remover libros**: Eliminación segura (verifica préstamos activos)

### Gestión de Préstamos
- **Vista completa**: Todos los préstamos de la biblioteca
- **Filtros por estado**: Activos, devueltos, vencidos
- **Marcar devoluciones**: Interfaz simple para marcar préstamos como devueltos
- **Estados visuales**: Badges de colores para identificar estados

### Estadísticas
- **Gráfico de préstamos**: Evolución mensual de préstamos
- **Libros populares**: Ranking de libros más prestados
- **Métricas clave**: Resumen de actividad de la biblioteca

## Seguridad

### Control de Acceso
- **Autenticación JWT**: Todos los endpoints requieren token válido
- **Autorización por rol**: Solo usuarios con rol 'admin' pueden acceder
- **Aislamiento de datos**: Los administradores solo ven datos de su biblioteca asignada

### Validaciones
- **Verificación de biblioteca**: Cada operación verifica que el admin tenga acceso a la biblioteca
- **Protección de eliminación**: No se pueden eliminar libros con préstamos activos
- **Validación de datos**: Todos los inputs son validados en backend

## Uso del Sistema

### Para Administradores de Biblioteca

1. **Acceso**: Iniciar sesión con credenciales de administrador
2. **Dashboard**: Ver resumen general de la biblioteca
3. **Gestión de Libros**:
   - Agregar libros del catálogo global a su biblioteca
   - Filtrar y buscar libros existentes
   - Remover libros (solo si no tienen préstamos activos)
4. **Gestión de Préstamos**:
   - Ver todos los préstamos de su biblioteca
   - Filtrar por estado (activos, devueltos, vencidos)
   - Marcar préstamos como devueltos
5. **Estadísticas**:
   - Analizar tendencias de préstamos
   - Identificar libros más populares
   - Monitorear actividad de usuarios

### Para Administradores del Sistema

1. **Asignación de Bibliotecas**: Usar el script para asignar admins a bibliotecas
2. **Monitoreo**: Supervisar el uso del sistema
3. **Mantenimiento**: Gestionar usuarios y roles

## Archivos Principales

### Backend
- `src/controllers/admin-biblioteca.controller.js` - Lógica de negocio
- `src/routes/admin-biblioteca.routes.js` - Definición de rutas
- `src/middleware/auth.js` - Middleware de autenticación

### Frontend
- `public/pages/admin/index.html` - Interfaz principal
- `public/services/admin-biblioteca.services.js` - Servicios de API
- `public/js/admin-functions.js` - Funciones JavaScript

### Scripts
- `scripts/assign-admin-to-library.js` - Script de asignación
- `db.sql` - Esquema de base de datos actualizado

## Troubleshooting

### Error: "No tienes una biblioteca asignada"
- Verificar que el usuario tenga rol 'admin'
- Asignar biblioteca usando el script de asignación
- Verificar que la tabla `usuario_biblioteca` tenga la relación correcta

### Error: "Error cargando datos"
- Verificar conexión a la base de datos
- Verificar que el token JWT sea válido
- Revisar logs del servidor para errores específicos

### Error: "No se puede eliminar: tiene préstamos asociados"
- Verificar que no haya préstamos activos para el libro
- Marcar préstamos como devueltos antes de eliminar
- Verificar la integridad de los datos de préstamos

## Próximas Mejoras

1. **Múltiples bibliotecas**: Permitir que un admin gestione varias bibliotecas
2. **Notificaciones**: Sistema de alertas para préstamos vencidos
3. **Reportes avanzados**: Exportación de datos y reportes personalizados
4. **Gestión de usuarios**: Administrar usuarios específicos de la biblioteca
5. **Configuración**: Personalizar configuraciones de la biblioteca
