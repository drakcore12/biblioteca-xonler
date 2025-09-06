# Sistema de Bloqueo de Navegación - Biblioteca Xonler

## Descripción

Este sistema implementa un bloqueo completo de navegación para las páginas de usuario una vez que han iniciado sesión exitosamente. Los usuarios no pueden navegar fuera de la carpeta `/pages/user/` usando ningún método de navegación.

## Características Implementadas

### 🔒 Bloqueo Completo de Navegación

1. **Botón de Retroceder del Navegador**
   - Bloquea el uso del botón "Atrás" del navegador
   - Mantiene al usuario dentro de la zona de usuario
   - Muestra mensaje de advertencia cuando se intenta salir

2. **Enlaces Externos**
   - Intercepta todos los clics en enlaces
   - Bloquea enlaces que apunten fuera de `/pages/user/`
   - Permite solo navegación dentro de la zona de usuario

3. **Navegación Programática**
   - Bloquea `window.location.href` hacia páginas externas
   - Intercepta `history.pushState()` y `history.replaceState()`
   - Previene redirecciones no autorizadas

4. **Teclas de Navegación**
   - Bloquea `Alt + Flecha Izquierda` (retroceder)
   - Bloquea `Alt + Flecha Derecha` (avanzar)
   - Mantiene control total sobre la navegación

5. **Navegación Directa por URL**
   - Verifica periódicamente cambios en la URL
   - Redirige automáticamente si se intenta acceder a páginas externas
   - Mantiene al usuario en la zona autorizada

## Archivos Modificados

### 1. `public/js/common/guard.js`
- **Nueva función**: `blockUserNavigation()`
- **Nueva función**: `showNavigationBlockMessage()`
- Implementa todo el sistema de bloqueo

### 2. Páginas de Usuario Actualizadas
- `public/pages/user/index.html`
- `public/pages/user/libros.html`
- `public/js/pages/configuracion.js`

Todas las páginas ahora importan y ejecutan `blockUserNavigation()` al inicializar.

## Cómo Funciona

### Inicialización
```javascript
import { blockUserNavigation } from '/js/common/guard.js';

// En la función de inicialización de cada página
blockUserNavigation();
```

### Detección de Páginas de Usuario
El sistema detecta automáticamente si estás en una página de usuario verificando si la URL contiene `/pages/user/`.

### Pila de Historial
- Mantiene una pila interna del historial de navegación
- Solo permite retroceder dentro de la zona de usuario
- Bloquea cualquier intento de salir de la zona

### Mensajes de Bloqueo
- Muestra alertas visuales cuando se bloquea la navegación
- Mensajes aparecen en la esquina superior derecha
- Se auto-ocultan después de 5 segundos

## Panel de Prueba (Desarrollo)

Se incluye un panel de prueba en la página principal del usuario que permite:

1. **Probar Navegación Externa**: Intenta ir a páginas fuera de la zona de usuario
2. **Probar Botón Retroceder**: Simula el uso del botón de retroceder
3. **Ver Estado de Navegación**: Muestra información sobre el estado actual
4. **Ocultar Panel**: Oculta el panel de prueba

### Activar Panel de Prueba
El panel se muestra automáticamente 2 segundos después de cargar la página. Para ocultarlo en producción, comenta esta línea en `index.html`:

```javascript
// setTimeout(() => {
//   const panel = document.getElementById('navigationTestPanel');
//   if (panel) {
//     panel.style.display = 'block';
//   }
// }, 2000);
```

## Configuración

### Rutas Permitidas
El sistema permite navegación solo a:
- `/pages/user/*` - Todas las páginas de usuario
- `/pages/guest/login.html` - Página de login (para logout)

### Rutas Bloqueadas
Todas las demás rutas están bloqueadas, incluyendo:
- `/pages/admin/*` - Páginas de administrador
- `/pages/guest/*` (excepto login) - Páginas de invitado
- Cualquier URL externa
- Enlaces `javascript:`
- Enlaces `mailto:`, `tel:`, etc.

## Personalización

### Modificar Rutas Permitidas
En `guard.js`, línea 217, puedes modificar la condición:

```javascript
if (!targetPath.includes('/pages/user/') && !targetPath.includes('/pages/guest/login.html')) {
```

### Personalizar Mensajes
En la función `showNavigationBlockMessage()`, puedes cambiar el mensaje:

```javascript
blockMessage.innerHTML = `
  <i class="bi bi-shield-exclamation me-2"></i>
  <strong>Tu mensaje personalizado aquí</strong>
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
`;
```

### Desactivar Bloqueo
Para desactivar el bloqueo temporalmente, comenta la llamada en las páginas:

```javascript
// blockUserNavigation(); // Comentado para desactivar
```

## Solución de Problemas

### El Bloqueo No Funciona
1. Verifica que `blockUserNavigation()` se esté llamando en cada página
2. Revisa la consola del navegador para errores
3. Asegúrate de que estás en una página que contiene `/pages/user/`

### Mensajes No Aparecen
1. Verifica que Bootstrap esté cargado correctamente
2. Revisa que no haya conflictos de CSS
3. Comprueba la consola para errores de JavaScript

### Navegación Dentro de Usuario No Funciona
1. Verifica que los enlaces internos tengan la ruta correcta
2. Asegúrate de que las rutas contengan `/pages/user/`
3. Revisa la consola para mensajes de bloqueo

## Consideraciones de Seguridad

⚠️ **Importante**: Este sistema es una medida de seguridad del lado del cliente y puede ser eludido por usuarios técnicamente avanzados. Para máxima seguridad, implementa también:

1. **Validación del lado del servidor**
2. **Middleware de autenticación en el backend**
3. **Verificación de tokens en cada request**
4. **Headers de seguridad HTTP**

## Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Navegadores móviles

## Notas de Desarrollo

- El sistema usa `setInterval` para verificar cambios de URL cada 100ms
- Los event listeners se agregan al documento completo
- El sistema es compatible con SPA (Single Page Applications)
- Funciona con enrutamiento del lado del cliente

## Conclusión

Este sistema proporciona un bloqueo robusto de navegación que mantiene a los usuarios autenticados dentro de su zona autorizada, previniendo el acceso accidental o intencional a otras áreas del sistema.
