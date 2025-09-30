# 📚 Biblioteca Xonler - Sistema de Gestión de Bibliotecas Escolares

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 📋 ¿Qué es Biblioteca Xonler?

Biblioteca Xonler es un sistema web que permite a los estudiantes de diferentes colegios buscar y pedir prestados libros de cualquier biblioteca de la red. Los administradores pueden gestionar sus bibliotecas, agregar libros y controlar los préstamos.

**En palabras simples:** Es como una biblioteca digital que conecta todas las bibliotecas de los colegios, permitiendo que los estudiantes vean y pidan libros de cualquier biblioteca de la red.

## 🚀 Guía de Instalación Paso a Paso

### Paso 1: Descargar e Instalar Node.js
1. Ve a [nodejs.org](https://nodejs.org/)
2. **Descarga la versión LTS** (actualmente v22.x - recomendada)
3. Ejecuta el instalador y sigue las instrucciones
4. Verifica la instalación abriendo PowerShell y escribiendo:
   ```bash
   node --version
   npm --version
   ```

### Paso 2: Descargar e Instalar PostgreSQL (Base de Datos)

#### 2.1 Descargar PostgreSQL
1. Ve a [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Haz clic en **"Download the installer"**
3. Selecciona la versión **18.x o 17.x** (recomendado) para Windows x86-64
4. Descarga el archivo `.exe` (aproximadamente 300MB)

#### 2.2 Instalar PostgreSQL
1. **Ejecuta el instalador** como administrador (clic derecho → "Ejecutar como administrador")
2. **Pantalla de bienvenida**: Haz clic en "Next"
3. **Seleccionar directorio**: Deja el directorio por defecto `C:\Program Files\PostgreSQL\18\` y haz clic "Next"
4. **Seleccionar componentes**: 
   - ✅ PostgreSQL Server (obligatorio)
   - ✅ pgAdmin 4 (interfaz gráfica - RECOMENDADO)
   - ✅ Stack Builder (herramientas adicionales)
   - ✅ Command Line Tools
   - Haz clic "Next"
5. **Seleccionar directorio de datos**: Deja `C:\Program Files\PostgreSQL\18\data` y haz clic "Next"
6. **Configurar contraseña**:
   - **IMPORTANTE**: Anota esta contraseña, la necesitarás después
   - Escribe una contraseña segura para el usuario `postgres`
   - Confirma la contraseña
   - Haz clic "Next"
7. **Puerto**: Deja el puerto `5432` (por defecto) y haz clic "Next"
8. **Configuración avanzada**: Deja todo por defecto y haz clic "Next"
9. **Preparar instalación**: Revisa la configuración y haz clic "Next"
10. **Instalando**: Espera a que termine (5-10 minutos)
11. **Completar**: Desmarca "Stack Builder" si no lo necesitas y haz clic "Finish"

#### 2.3 Verificar la instalación
1. **Abre PowerShell** como administrador
2. **Verifica PostgreSQL**:
   ```bash
   psql --version
   ```
3. **Conecta a la base de datos**:
   ```bash
   psql -U postgres -h localhost
   ```
4. **Ingresa la contraseña** que configuraste
5. **Si funciona**, verás algo como: `postgres=#`
6. **Salir**: Escribe `\q` y presiona Enter

### Paso 3: Configurar el Proyecto
1. **Clonar el proyecto:**
   ```bash
   git clone https://github.com/Srpino/Biblioteca-Xonler.git
   cd Biblioteca-Xonler
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar la base de datos con pgAdmin:**

#### 3.1 Abrir pgAdmin
1. **Busca pgAdmin** en el menú inicio de Windows
2. **Abre pgAdmin 4** (puede tardar 30-60 segundos en cargar)
3. **Configurar contraseña maestra** (primera vez):
   - pgAdmin te pedirá una contraseña maestra para proteger tus conexiones
   - Esta es DIFERENTE a la contraseña de PostgreSQL
   - Anota esta contraseña también

#### 3.2 Conectar al servidor PostgreSQL
1. **En el panel izquierdo**, verás "Servers"
2. **Haz clic derecho** en "Servers" → "Register" → "Server"
3. **Pestaña "General"**:
   - Name: `PostgreSQL 15` (o el nombre que quieras)
4. **Pestaña "Connection"**:
   - Host name/address: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: `[la contraseña que configuraste en la instalación]`
5. **Haz clic "Save"**

#### 3.3 Crear la base de datos
1. **Expande** el servidor "PostgreSQL 15"
2. **Expande** "Databases"
3. **Haz clic derecho** en "Databases" → "Create" → "Database"
4. **Configuración**:
   - Database: `xonler`
   - Owner: `postgres`
   - Encoding: `UTF8`
5. **Haz clic "Save"**

#### 3.4 Ejecutar el archivo SQL
1. **Haz clic** en la base de datos `xonler` (panel izquierdo)
2. **Haz clic** en el ícono "Query Tool" (🔍) en la barra superior
3. **Abre el archivo**:
   - Clic en "Open File" (📁)
   - Navega a tu proyecto: `C:\Users\[TU_USUARIO]\Documents\Proyectos-Cursor\Biblioteca-Xonler-main\`
   - Selecciona `db.sql`
4. **Ejecutar el script**:
   - Clic en "Execute" (⚡) o presiona F5
   - Espera a que termine (puede tardar 1-2 minutos)
   - Deberías ver "Query returned successfully" en la parte inferior

4. **Configurar variables de entorno:**
   - Copia `env.example` y renómbralo a `.env`
   - Edita el archivo `.env` con tus datos:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=xonler
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña_de_postgres
   JWT_SECRET=tu_secreto_muy_seguro_aqui
   PORT=3000
   ```

### Paso 4: Ejecutar el Proyecto
```bash
npm run dev
```

El proyecto estará disponible en: `http://localhost:3000`

### Paso 5: Configurar Cloudflare Tunnel (Proxy Inverso)

#### 5.1 Instalar Cloudflared (Método Recomendado)

**Opción A: Instalación automática con winget (RECOMENDADO)**
1. **Abre PowerShell** como administrador
2. **Instala cloudflared**:
   ```bash
   winget install Cloudflare.Cloudflared
   ```
3. **Verifica la instalación**:
   ```bash
   cloudflared --version
   ```

**Opción B: Instalación manual**
1. **Ve a la página oficial**: [developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/#windows](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/#windows)
2. **Descarga el archivo**:
   - Busca "Windows amd64" y haz clic en el enlace de descarga
   - Se descargará un archivo `.exe` (aproximadamente 15MB)
3. **Mover a carpeta de usuario**:
   - Copia `cloudflared.exe` a tu carpeta de usuario: `C:\Users\[TU_USUARIO]\`
   - **Verifica** que esté en: `C:\Users\[TU_USUARIO]\cloudflared.exe`

#### 5.2 Verificar que el proyecto esté ejecutándose
1. **Abre PowerShell** en la carpeta del proyecto
2. **Ejecuta el proyecto**:
   ```bash
   npm run dev
   ```
3. **Verifica** que veas:
   ```
   Server running on port 3000
   Database connected successfully
   ```
4. **Abre tu navegador** y ve a `http://localhost:3000`
5. **Si funciona**, verás la página de inicio de Biblioteca Xonler

#### 5.3 Crear el túnel de Cloudflare

**Método Simplificado (RECOMENDADO)**
1. **Abre una NUEVA ventana de PowerShell** (no cierres la del proyecto)
2. **Crear el túnel**:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. **Espera la conexión** (10-30 segundos):
   - Verás mensajes como "Connecting to Cloudflare..."
   - Al final verás algo como: `https://abc123-def456.trycloudflare.com`

**Método Alternativo (si usaste instalación manual)**
1. **Abre una NUEVA ventana de PowerShell** (no cierres la del proyecto)
2. **Navega a tu carpeta de usuario**:
   ```bash
   cd $env:USERPROFILE
   ```
3. **Verifica que cloudflared.exe esté ahí**:
   ```bash
   dir cloudflared.exe
   ```
4. **Crear el túnel**:
   ```bash
   & "$env:USERPROFILE\cloudflared.exe" tunnel --url http://127.0.0.1:3000
   ```
5. **Espera la conexión** (10-30 segundos):
   - Verás mensajes como "Connecting to Cloudflare..."
   - Al final verás algo como: `https://abc123-def456.trycloudflare.com`

#### 5.4 Usar el túnel
1. **Copia la URL** que te dio Cloudflare (ej: `https://abc123-def456.trycloudflare.com`)
2. **Pruébala** en tu navegador
3. **Comparte esta URL** con otros para que accedan desde internet
4. **IMPORTANTE**: 
   - El túnel solo funciona mientras tengas PowerShell abierto
   - Si cierras PowerShell, el túnel se desconecta
   - La URL cambia cada vez que reinicias el túnel

#### 5.5 Mantener el túnel activo
1. **Para mantener el túnel activo**:
   - No cierres la ventana de PowerShell donde ejecutaste el comando
   - Si se cierra, repite el paso 5.4
2. **Para detener el túnel**:
   - Presiona `Ctrl + C` en la ventana de PowerShell del túnel
3. **Para reiniciar el túnel**:
   - Ejecuta nuevamente el comando del paso 5.3

#### 5.6 Ejecutar como servicio (Opcional - Para URL estable)

Si quieres que el túnel se mantenga activo permanentemente y arranque con Windows:

1. **Crear un túnel persistente**:
   ```bash
   cloudflared tunnel create xonler-tunnel
   ```
2. **Configurar el túnel**:
   ```bash
   cloudflared tunnel route dns xonler-tunnel xonler.local
   ```
3. **Ejecutar como servicio**:
   ```bash
   cloudflared tunnel run xonler-tunnel
   ```

**Para más detalles**, consulta la [guía oficial de Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/as-a-service/windows/) sobre ejecutar como servicio en Windows.

### Paso 6: Verificación Final

#### 6.1 Verificar que todo funciona localmente
1. **Abre tu navegador** y ve a `http://localhost:3000`
2. **Deberías ver**:
   - La página de inicio de Biblioteca Xonler
   - Un menú de navegación
   - Opciones de login/registro
3. **Si NO ves esto**, revisa la sección de "Solución de Problemas" abajo

#### 6.2 Verificar que el túnel funciona
1. **Abre otra pestaña** del navegador
2. **Ve a la URL** que te dio Cloudflare (ej: `https://abc123-def456.trycloudflare.com`)
3. **Deberías ver** la misma página que en localhost
4. **Si funciona**, ¡felicidades! Tu proyecto está disponible en internet

#### 6.3 Probar desde otro dispositivo
1. **Conecta tu teléfono** a la misma red WiFi (o usa datos móviles)
2. **Abre el navegador** del teléfono
3. **Ve a la URL** de Cloudflare
4. **Deberías poder acceder** al proyecto desde tu teléfono

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** (v18+) - Entorno de ejecución JavaScript
- **Express** (v5.1.0) - Framework web minimalista
- **PostgreSQL** (v13+) - Base de datos relacional
- **bcrypt** (v6.0.0) - Encriptación de contraseñas
- **jsonwebtoken** (v9.0.2) - Generación y validación de JWT
- **cors** (v2.8.5) - Middleware para CORS
- **dotenv** (v16.6.1) - Manejo de variables de entorno
- **multer** (v1.4.5) - Manejo de subida de archivos
- **qrcode** (v1.5.4) - Generación de códigos QR
- **speakeasy** (v2.0.0) - Implementación de 2FA/TOTP

### Desarrollo
- **nodemon** (v3.0.0) - Reinicio automático del servidor en desarrollo

## ✨ ¿Qué puede hacer este sistema?

### Para Estudiantes 👨‍🎓
- **Registrarse y entrar** al sistema de forma segura
- **Buscar libros** en todas las bibliotecas de la red
- **Pedir libros prestados** online
- **Ver el estado** de sus préstamos
- **Recibir notificaciones** cuando se vencen los préstamos
- **Ver su historial** de libros prestados

### Para Administradores 👨‍💼
- **Gestionar libros** de su biblioteca (agregar, editar, eliminar)
- **Controlar préstamos** (aprobar, rechazar, marcar como devueltos)
- **Ver estadísticas** de su biblioteca
- **Configurar la biblioteca** (horarios, reglas, etc.)
- **Generar reportes** de actividad

### Para Bibliotecarios 📚
- **Gestionar el inventario** de libros
- **Procesar préstamos** y devoluciones
- **Atender consultas** de estudiantes
- **Mantener actualizado** el catálogo

## 📖 Glosario de Términos Técnicos

| Término | Explicación Simple |
|---------|-------------------|
| **Node.js** | Programa que permite ejecutar JavaScript en el servidor (como el motor de un coche) |
| **PostgreSQL** | Base de datos donde se guarda toda la información (como un archivo gigante organizado) |
| **Express** | Herramienta que facilita crear páginas web (como los cimientos de una casa) |
| **JWT** | "Carnet de identidad" digital que dice quién eres en el sistema |
| **2FA** | Doble verificación de seguridad (como pedir contraseña + código por SMS) |
| **API** | "Traductor" que permite que diferentes partes del sistema se comuniquen |
| **Middleware** | "Filtro de seguridad" que revisa las peticiones antes de procesarlas |
| **CORS** | Permiso para que páginas web de diferentes sitios se comuniquen |
| **bcrypt** | Método súper seguro para guardar contraseñas (imposible de descifrar) |
| **Cloudflare Tunnel** | "Túnel" que permite acceder a tu proyecto desde internet sin abrir puertos |
| **npm** | "Tienda de aplicaciones" para descargar herramientas de programación |
| **Git** | Sistema para guardar y controlar versiones del código (como "historial" de Word) |
| **Puerto 3000** | "Dirección" donde tu computadora escucha las peticiones web |
| **localhost** | Dirección de tu propia computadora (127.0.0.1) |

## 🏗️ ¿Cómo está organizado el proyecto?

### Estructura Simple
```
📁 Biblioteca-Xonler/
├── 📁 src/                    # Código del servidor
│   ├── 📄 app.js             # Configuración principal
│   ├── 📄 server.js          # Inicio del servidor
│   ├── 📁 controllers/       # Lógica de cada función
│   ├── 📁 routes/            # URLs del sistema
│   └── 📁 middleware/        # Seguridad
├── 📁 public/                # Páginas web (lo que ven los usuarios)
│   ├── 📁 pages/             # Páginas HTML
│   ├── 📁 services/          # Código JavaScript del frontend
│   └── 📁 css/               # Estilos y diseño
├── 📄 db.sql                 # Estructura de la base de datos
├── 📄 package.json           # Lista de herramientas necesarias
└── 📄 README.md              # Este archivo
```

### Base de Datos (PostgreSQL)
El sistema guarda información en estas "carpetas" principales:
- **usuarios** - Datos de estudiantes y administradores
- **bibliotecas** - Información de cada biblioteca
- **libros** - Catálogo de todos los libros
- **prestamos** - Registro de quién pidió qué libro
- **colegios** - Información de los colegios

## 📖 Cómo usar el sistema

### Para Estudiantes
1. **Registrarse**: Crear cuenta en la página de login
2. **Iniciar sesión**: Entrar con email y contraseña
3. **Buscar libros**: Explorar el catálogo completo
4. **Pedir préstamos**: Solicitar libros que te interesen
5. **Gestionar perfil**: Actualizar tu información personal

### Para Administradores
1. **Acceder al panel**: Login con rol de administrador
2. **Gestionar libros**: Agregar, editar, eliminar libros
3. **Controlar préstamos**: Ver y administrar préstamos
4. **Ver estadísticas**: Revisar métricas de la biblioteca
5. **Configurar**: Ajustar parámetros de la biblioteca

## 🛡️ Seguridad del Sistema

### ¿Qué hace que sea seguro?
- **Contraseñas encriptadas**: Imposibles de descifrar aunque alguien acceda a la base de datos
- **Verificación en dos pasos**: Opcional, como un segundo candado en tu cuenta
- **Sesiones seguras**: El sistema "recuerda" quién eres de forma segura
- **Protección de datos**: Solo los usuarios autorizados pueden ver información sensible
- **Validación de entrada**: El sistema revisa todo lo que escribes para evitar ataques

### ¿Quién puede hacer qué?
- **Estudiantes**: Ver libros, pedir préstamos, gestionar su perfil
- **Bibliotecarios**: Gestionar libros de su biblioteca, procesar préstamos
- **Administradores**: Control total de su biblioteca asignada
- **Super Administradores**: Acceso a todo el sistema

## 🚨 Solución de Problemas Comunes

### ❌ Error: "node no se reconoce como comando"
**Problema**: Node.js no está instalado o no está en el PATH
**Solución**:
1. Ve a [nodejs.org](https://nodejs.org/) y descarga Node.js
2. Instálalo siguiendo el Paso 1
3. Reinicia PowerShell
4. Verifica con: `node --version`

### ❌ Error: "psql no se reconoce como comando"
**Problema**: PostgreSQL no está instalado o no está en el PATH
**Solución**:
1. Sigue el Paso 2 completo para instalar PostgreSQL
2. Reinicia PowerShell
3. Verifica con: `psql --version`

### ❌ Error: "Cannot connect to database"
**Problema**: PostgreSQL no está ejecutándose o credenciales incorrectas
**Solución**:
1. **Verifica que PostgreSQL esté ejecutándose**:
   - Busca "Services" en el menú inicio
   - Busca "postgresql-x64-15" (o similar)
   - Si está "Stopped", haz clic derecho → "Start"
2. **Verifica las credenciales en .env**:
   - Usuario: `postgres`
   - Contraseña: la que configuraste en la instalación
   - Puerto: `5432`
3. **Prueba la conexión**:
   ```bash
   psql -U postgres -h localhost
   ```

### ❌ Error: "Database 'xonler' does not exist"
**Problema**: No creaste la base de datos
**Solución**:
1. Abre pgAdmin
2. Sigue el Paso 3.3 para crear la base de datos
3. Sigue el Paso 3.4 para ejecutar el archivo db.sql

### ❌ Error: "cloudflared no se reconoce como comando"
**Problema**: Cloudflared no está instalado o no está en el PATH
**Solución**:
1. **Si usaste winget**: Verifica con `cloudflared --version`
2. **Si usaste instalación manual**: Verifica que esté en: `C:\Users\[TU_USUARIO]\cloudflared.exe`
3. **Reinstala** siguiendo el Paso 5.1 completo

### ❌ Error: "Tunnel connection failed"
**Problema**: El proyecto no está ejecutándose o hay problemas de red
**Solución**:
1. **Verifica que el proyecto esté ejecutándose**:
   - Debe mostrar "Server running on port 3000"
   - Debe mostrar "Database connected successfully"
2. **Verifica que localhost:3000 funcione**:
   - Abre `http://localhost:3000` en tu navegador
3. **Reinicia el túnel**:
   - Cierra PowerShell del túnel (Ctrl+C)
   - Ejecuta nuevamente el comando del Paso 5.3

### ❌ Error: "Port 3000 is already in use"
**Problema**: Otro programa está usando el puerto 3000
**Solución**:
1. **Cambia el puerto en .env**:
   ```env
   PORT=3001
   ```
2. **Reinicia el proyecto**:
   ```bash
   npm run dev
   ```
3. **Actualiza el túnel**:
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

### ❌ El túnel se desconecta constantemente
**Problema**: Problemas de red o configuración
**Solución**:
1. **Verifica tu conexión a internet**
2. **Reinicia el túnel**:
   - Cierra PowerShell del túnel
   - Espera 30 segundos
   - Ejecuta nuevamente el comando del Paso 5.3
3. **Usa un puerto diferente** si el problema persiste

### ❌ No puedo acceder desde mi teléfono
**Problema**: Problemas de red o túnel
**Solución**:
1. **Verifica que el túnel esté activo**:
   - Debe mostrar la URL en PowerShell
2. **Prueba desde la misma computadora**:
   - Abre la URL en el navegador de la computadora
3. **Verifica que uses la URL correcta**:
   - Debe empezar con `https://`
   - Debe terminar con `.trycloudflare.com`

## 🎯 Próximas Mejoras

- **App móvil** para Android e iOS
- **Notificaciones push** para recordatorios de préstamos
- **Sistema de calificaciones** para libros
- **Chat en tiempo real** entre usuarios
- **Integración con sistemas escolares** existentes
- **Modo offline** para consultar libros sin internet

## 📞 ¿Necesitas Ayuda?

Si tienes problemas o preguntas:

1. **Revisa la sección de "Solución de Problemas"** arriba
2. **Consulta el glosario** para entender términos técnicos
3. **Verifica que sigas todos los pasos** de instalación
4. **Contacta al soporte** si el problema persiste

### Información de Contacto
- 📧 **Email**: info@xonler.edu
- 🐛 **Reportar errores**: [GitHub Issues](https://github.com/Srpino/Biblioteca-Xonler/issues)
- 📖 **Documentación**: Este README

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Puedes usarlo, modificarlo y distribuirlo libremente.

## 👥 Créditos

- **Desarrollado por**: Equipo Xonler
- **GitHub**: [Srpino](https://github.com/Srpino)
- **Tecnologías**: Node.js, PostgreSQL, Express, Bootstrap

---

**📚 Biblioteca Xonler** - Conectando el conocimiento a través de las bibliotecas escolares ✨

*Última actualización: Diciembre 2024*
