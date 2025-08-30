# Servicios de la Aplicación Xonler

Este directorio contiene todos los servicios JavaScript que manejan la lógica de negocio y la interacción con la API del frontend.

## 📁 Servicios Disponibles

### 🔐 **Servicios de Autenticación**

#### `auth.services.js`
- **Clase principal**: `AuthService`
- **Funcionalidades**:
  - Login y registro de usuarios
  - Gestión de tokens JWT
  - Verificación de roles y permisos
  - Refresh automático de tokens
  - Gestión de sesión (localStorage/sessionStorage)
- **Uso**: Importar `{ authService }` o funciones individuales

#### `login.services.js`
- **Funcionalidades**:
  - Manejo del formulario de login
  - Validación de credenciales
  - Redirección post-login según rol
  - Toggle de mostrar/ocultar contraseña
- **Uso**: Importar `{ initLoginForm }`

#### `registro.services.js`
- **Funcionalidades**:
  - Manejo del formulario de registro
  - Validación de datos en tiempo real
  - Indicador de fortaleza de contraseña
  - Validación de confirmación de contraseña
- **Uso**: Importar `{ initRegistroForm, initPasswordValidation }`

### 📚 **Servicios de Contenido**

#### `bibliotecas.services.js`
- **Funcionalidades**:
  - Carga de bibliotecas (usuarios autenticados)
  - Listado de libros por biblioteca
  - Búsqueda y filtrado de bibliotecas
  - Integración con mapa de Google
- **Uso**: Importar `initBibliotecasPage()` como default

#### `bibliotecas-guest.services.js`
- **Funcionalidades**:
  - Carga de bibliotecas públicas (sin autenticación)
  - Vista limitada para invitados
  - Mensajes de login requerido
- **Uso**: Importar `{ initBibliotecasGuestPage, mostrarLoginRequerido }`

#### `libros.services.js`
- **Funcionalidades**:
  - Catálogo completo de libros
  - Búsqueda global y filtros avanzados
  - Vista de detalles de libros
  - Gestión de imágenes y fallbacks
- **Uso**: Importar `initLibrosPage()` como default

### 👤 **Servicios de Usuario**

#### `user.services.js`
- **Funcionalidades**:
  - Gestión de perfil de usuario
  - Actualización de datos personales
  - Cambio de contraseña
  - Gestión de preferencias
- **Uso**: Importar funciones individuales según necesidad

### 📧 **Servicios de Comunicación**

#### `contacto.services.js`
- **Funcionalidades**:
  - Formulario de contacto
  - Validación de datos
  - Envío de mensajes
  - Manejo de respuestas
- **Uso**: Importar `{ initContactoForm }`

### 🏠 **Servicios de Páginas**

#### `index-guest.services.js`
- **Funcionalidades**:
  - Inicialización de página principal
  - Efectos visuales y animaciones
  - Navegación y eventos
  - Mensajes de bienvenida
- **Uso**: Importar `{ initIndexGuestPage, initVisualEffects }`

## 🚀 **Uso Básico**

### Importar un servicio completo:
```javascript
import { initBibliotecasPage } from '/services/bibliotecas.services.js';

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  initBibliotecasPage();
});
```

### Importar funciones específicas:
```javascript
import { initLoginForm, initRegistroForm } from '/services/login.services.js';
import { initContactoForm } from '/services/contacto.services.js';

// Inicializar múltiples servicios
initLoginForm();
initRegistroForm();
initContactoForm();
```

### Usar el servicio de autenticación:
```javascript
import { authService, login, logout } from '/services/auth.services.js';

// Verificar autenticación
if (authService.isAuthenticated()) {
  console.log('Usuario autenticado');
}

// Login
const result = await login('email@example.com', 'password');
if (result.success) {
  console.log('Login exitoso');
}
```

## 🔧 **Configuración**

### Variables de Entorno:
Los servicios utilizan las siguientes variables por defecto:
- **API Base**: `/api`
- **Storage Keys**: `token`, `role`, `userId`, `userName`

### Headers de Autenticación:
Los servicios automáticamente incluyen headers de autenticación cuando están disponibles:
```javascript
{
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

## 📱 **Compatibilidad**

- **Navegadores**: ES6+ (Chrome 60+, Firefox 55+, Safari 12+)
- **Módulos**: ES6 Modules
- **APIs**: Fetch API, LocalStorage, SessionStorage
- **Frameworks**: Bootstrap 5, Bootstrap Icons

## 🐛 **Debug y Logging**

Todos los servicios incluyen logging detallado para facilitar el debugging:
- ✅ Operaciones exitosas
- ⚠️ Advertencias
- ❌ Errores
- 🔍 Información de debug
- 🔐 Operaciones de autenticación
- 📚 Operaciones de contenido

### Ejemplo de debug:
```javascript
import { debugAuth } from '/services/auth.services.js';

// Mostrar información de autenticación en consola
debugAuth();
```

## 🔄 **Flujo de Datos**

1. **Página se carga** → Se importan los servicios necesarios
2. **Servicios se inicializan** → Se configuran event listeners
3. **Usuario interactúa** → Los servicios procesan la acción
4. **API se llama** → Con headers de autenticación si es necesario
5. **Respuesta se procesa** → Se actualiza la UI
6. **Errores se manejan** → Se muestran mensajes apropiados

## 📝 **Notas de Desarrollo**

- Todos los servicios son modulares y reutilizables
- Se incluye manejo de errores robusto
- Los servicios verifican la existencia de elementos DOM antes de usarlos
- Se implementa fallback para funcionalidades no disponibles
- Los servicios son compatibles con el sistema de autenticación JWT

## 🆘 **Soporte**

Para problemas o preguntas sobre los servicios:
1. Revisar la consola del navegador para errores
2. Verificar que los elementos DOM existan
3. Confirmar que la API esté funcionando
4. Revisar el estado de autenticación con `debugAuth()`
