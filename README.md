# Biblioteca Xonler

> Sistema de Gestión de Bibliotecas Escolares Interconectadas

---

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
[![CI - Pruebas Automatizadas](https://github.com/drakcore12/biblioteca-xonler/actions/workflows/ci.yml/badge.svg)](https://github.com/drakcore12/biblioteca-xonler/actions/workflows/ci.yml)
[![SonarQube Analysis](https://github.com/drakcore12/biblioteca-xonler/actions/workflows/sonar.yml/badge.svg)](https://github.com/drakcore12/biblioteca-xonler/actions/workflows/sonar.yml)

---

## Visión General

Biblioteca Xonler es una plataforma web diseñada para conectar bibliotecas escolares en una red unificada, permitiendo a estudiantes acceder y solicitar préstamos de libros desde cualquier biblioteca del sistema. El sistema proporciona herramientas completas de gestión para administradores y bibliotecarios, facilitando el control de inventarios, préstamos y estadísticas.

La arquitectura del sistema está construida sobre principios de modularidad, seguridad y escalabilidad, implementando mejores prácticas de desarrollo y manteniendo estándares de calidad mediante análisis estático de código y pruebas automatizadas.

---

## Características Principales

### Para Estudiantes
- Registro y autenticación segura con soporte para verificación en dos factores
- Búsqueda avanzada de libros en todas las bibliotecas de la red
- Sistema de solicitud de préstamos en línea
- Seguimiento del estado de préstamos activos
- Historial completo de préstamos realizados
- Notificaciones automáticas de vencimientos

### Para Administradores
- Panel de control completo para gestión de bibliotecas
- Administración de inventario de libros (CRUD completo)
- Control de préstamos con aprobación y rechazo
- Generación de estadísticas y reportes
- Configuración de parámetros de biblioteca
- Gestión de usuarios y permisos

### Para Bibliotecarios
- Interfaz optimizada para gestión diaria
- Procesamiento rápido de préstamos y devoluciones
- Actualización de catálogo en tiempo real
- Consultas y atención a estudiantes

---

## Arquitectura Técnica

### Stack Tecnológico

**Backend**
- Node.js (v18+) - Entorno de ejecución JavaScript del lado del servidor
- Express.js (v5.1.0) - Framework web minimalista y flexible
- PostgreSQL (v13+) - Sistema de gestión de bases de datos relacional
- bcrypt (v6.0.0) - Algoritmo de hash para encriptación de contraseñas
- jsonwebtoken (v9.0.2) - Implementación de tokens JWT para autenticación
- cors (v2.8.5) - Middleware para configuración de políticas CORS
- dotenv (v16.6.1) - Gestión de variables de entorno
- multer (v1.4.5) - Middleware para manejo de carga de archivos
- qrcode (v1.5.4) - Generación de códigos QR
- speakeasy (v2.0.0) - Implementación de autenticación de dos factores (2FA/TOTP)

**Desarrollo y Testing**
- nodemon (v3.0.0) - Herramienta de desarrollo con reinicio automático
- Jest - Framework de testing unitario
- Playwright - Framework de testing end-to-end
- Artillery - Herramienta de testing de carga y rendimiento
- SonarQube - Plataforma de análisis estático de código

**Infraestructura y CI/CD**
- GitHub Actions - Integración continua y despliegue automático
- Jenkins - Pipeline de CI/CD para entornos locales y producción
- Docker - Contenedorización de servicios y aplicaciones

### Estructura del Proyecto

```
biblioteca-xonler/
├── src/                          # Código fuente del servidor
│   ├── app.js                    # Configuración principal de Express
│   ├── server.js                 # Punto de entrada del servidor
│   ├── config/                   # Configuraciones del sistema
│   │   ├── database.js          # Configuración de conexión PostgreSQL
│   │   └── database-ssl.js      # Configuración SSL para producción
│   ├── controllers/              # Lógica de negocio y controladores
│   ├── routes/                   # Definición de rutas y endpoints
│   ├── middleware/               # Middleware de seguridad y validación
│   ├── services/                 # Servicios de lógica de negocio
│   └── utils/                    # Utilidades y helpers
├── public/                       # Frontend y recursos estáticos
│   ├── pages/                    # Páginas HTML
│   ├── services/                 # Servicios JavaScript del cliente
│   ├── css/                      # Hojas de estilo
│   │   ├── variables.css        # Variables de diseño (paleta de colores)
│   │   ├── base.css             # Estilos base y tipografía
│   │   ├── components/          # Estilos de componentes
│   │   └── layout/              # Estilos de layout
│   └── js/                       # Scripts JavaScript del cliente
├── tests/                        # Suite de pruebas automatizadas
│   ├── unit/                     # Tests unitarios (Jest)
│   └── e2e/                      # Tests end-to-end (Playwright)
├── .github/                      # Configuración de GitHub
│   └── workflows/                # Definiciones de GitHub Actions
├── Jenkinsfile                   # Pipeline de Jenkins
├── sonar-project.properties      # Configuración de SonarQube
├── jest.config.js                # Configuración de Jest
├── playwright.config.js          # Configuración de Playwright
├── docker-compose.yml            # Orquestación de contenedores
├── db.sql                        # Esquema de base de datos
├── package.json                  # Dependencias y scripts
└── README.md                     # Este documento
```

### Base de Datos

El sistema utiliza PostgreSQL como base de datos relacional, organizando la información en las siguientes entidades principales:

- **usuarios** - Información de estudiantes, bibliotecarios y administradores
- **bibliotecas** - Datos de cada biblioteca en la red
- **libros** - Catálogo completo de libros disponibles
- **prestamos** - Registro histórico y activo de préstamos
- **colegios** - Información de instituciones educativas
- **usuario_biblioteca** - Relación muchos-a-muchos entre usuarios y bibliotecas
- **biblioteca_libros** - Relación entre bibliotecas y sus libros

---

## Guía de Instalación

### Requisitos Previos

- Node.js v18 o superior
- PostgreSQL v13 o superior
- npm o yarn
- Git

### Instalación de Node.js

1. Visite [nodejs.org](https://nodejs.org/)
2. Descargue la versión LTS (Long Term Support)
3. Ejecute el instalador siguiendo las instrucciones
4. Verifique la instalación:

```bash
node --version
npm --version
```

### Instalación de PostgreSQL

#### Descarga e Instalación

1. Visite [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Descargue el instalador para Windows
3. Ejecute el instalador como administrador
4. Durante la instalación:
   - Seleccione todos los componentes recomendados
   - Configure una contraseña segura para el usuario `postgres`
   - Mantenga el puerto por defecto (5432)
5. Verifique la instalación:

```bash
psql --version
```

#### Configuración de la Base de Datos

1. Abra pgAdmin 4 desde el menú de inicio
2. Configure la contraseña maestra (primera ejecución)
3. Conecte al servidor PostgreSQL:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: [su contraseña configurada]
4. Cree la base de datos:
   - Nombre: `xonler`
   - Owner: `postgres`
   - Encoding: `UTF8`
5. Ejecute el script de inicialización:
   - Abra el archivo `db.sql` en el Query Tool
   - Ejecute el script completo

### Configuración del Proyecto

1. Clone el repositorio:

```bash
git clone https://github.com/drakcore12/biblioteca-xonler.git
cd biblioteca-xonler
```

2. Instale las dependencias:

```bash
npm install
```

3. Configure las variables de entorno:

Copie `env.example` a `.env` y configure los siguientes valores:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=xonler
DB_USER=postgres
DB_PASSWORD=su_contraseña_postgres

JWT_SECRET=generar_secreto_seguro_aleatorio
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=12
```

### Ejecución

Inicie el servidor en modo desarrollo:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## Testing y Calidad de Código

### Ejecución de Tests

#### Tests Unitarios

```bash
# Ejecutar todos los tests unitarios
npm test

# Ejecutar con cobertura de código
npm run test:coverage

# Modo watch para desarrollo
npm run test:watch
```

#### Tests End-to-End

```bash
# Ejecutar suite completa de tests E2E
npm run test:e2e

# Ejecutar con interfaz gráfica
npm run test:e2e:ui
```

#### Tests de Carga

```bash
# Ejecutar tests de rendimiento
npm run test:load
```

### Integración Continua

El proyecto implementa pipelines de CI/CD para garantizar la calidad del código:

#### GitHub Actions

- **CI - Pruebas Automatizadas**: Ejecuta tests unitarios y E2E en cada push y pull request
- **SonarQube Analysis**: Analiza la calidad del código y genera reportes de cobertura

Los workflows se activan automáticamente en:
- Push a las ramas `main` y `develop`
- Pull requests hacia `main` y `develop`

#### Jenkins Pipeline

El `Jenkinsfile` define un pipeline completo que incluye:

1. Preparación del entorno
2. Instalación de dependencias
3. Ejecución de tests unitarios con cobertura
4. Análisis de calidad con SonarQube
5. Construcción y despliegue con Docker
6. Tests end-to-end con Playwright
7. Tests de carga con Artillery
8. Verificación final del despliegue

### Análisis de Código con SonarQube

```bash
# Análisis local (requiere SonarQube en localhost:9000)
npm run sonar:local

# Análisis con SonarCloud
npm run sonar:cloud
```

**Configuración en GitHub Actions**: Configure los siguientes secrets en su repositorio:
- `SONAR_TOKEN`: Token de autenticación de SonarQube
- `SONAR_HOST_URL`: URL de su instancia de SonarQube

### Reportes de Cobertura

Los reportes de cobertura se generan automáticamente:
- **Directorio**: `coverage/`
- **Formato HTML**: `coverage/index.html`
- **Formato LCOV**: `coverage/lcov.info` (para SonarQube)

---

## Seguridad

### Implementaciones de Seguridad

- **Encriptación de contraseñas**: Utiliza bcrypt con 12 rondas de hash
- **Autenticación JWT**: Tokens firmados con expiración configurable
- **Verificación en dos factores**: Soporte opcional para 2FA/TOTP
- **Validación de entrada**: Sanitización y validación de todos los inputs
- **Protección CORS**: Configuración restrictiva de políticas CORS
- **Middleware de seguridad**: Helmet.js para headers de seguridad HTTP
- **Rate limiting**: Protección contra ataques de fuerza bruta

### Control de Acceso

El sistema implementa un modelo de roles y permisos:

- **Estudiantes**: Acceso de lectura y solicitud de préstamos
- **Bibliotecarios**: Gestión de libros y préstamos en su biblioteca asignada
- **Administradores**: Control completo de su biblioteca asignada
- **Super Administradores**: Acceso administrativo a todo el sistema

---

## Despliegue

### Cloudflare Tunnel (Desarrollo)

Para exponer el servidor local a internet sin abrir puertos:

1. Instale Cloudflared:

```bash
winget install Cloudflare.Cloudflared
```

2. Verifique que el servidor esté ejecutándose en `http://localhost:3000`

3. Cree el túnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

4. Copie la URL proporcionada por Cloudflare para acceso externo

### Docker

El proyecto incluye configuración Docker Compose para despliegue completo:

```bash
docker-compose up -d
```

Esto iniciará todos los servicios necesarios:
- Servidor de aplicación
- Base de datos PostgreSQL
- SonarQube (opcional)
- Servicios de monitoreo

---

## Solución de Problemas

### Error: "node no se reconoce como comando"

**Causa**: Node.js no está instalado o no está en el PATH del sistema.

**Solución**:
1. Instale Node.js desde [nodejs.org](https://nodejs.org/)
2. Reinicie la terminal o PowerShell
3. Verifique con `node --version`

### Error: "Cannot connect to database"

**Causa**: PostgreSQL no está ejecutándose o las credenciales son incorrectas.

**Solución**:
1. Verifique que el servicio PostgreSQL esté activo:
   - Abra "Services" desde el menú de inicio
   - Busque "postgresql-x64-15" (o versión correspondiente)
   - Inicie el servicio si está detenido
2. Verifique las credenciales en `.env`
3. Pruebe la conexión:

```bash
psql -U postgres -h localhost
```

### Error: "Database 'xonler' does not exist"

**Causa**: La base de datos no ha sido creada.

**Solución**:
1. Abra pgAdmin
2. Cree la base de datos `xonler`
3. Ejecute el script `db.sql` en el Query Tool

### Error: "Port 3000 is already in use"

**Causa**: Otro proceso está utilizando el puerto 3000.

**Solución**:
1. Cambie el puerto en `.env`: `PORT=3001`
2. Reinicie el servidor
3. Actualice la URL del túnel si está usando Cloudflare

---

## Estado del Proyecto

### Calidad de Código

- Tests unitarios configurados con Jest
- Tests E2E configurados con Playwright
- Tests de carga configurados con Artillery
- Análisis estático de código con SonarQube
- Cobertura de código monitoreada continuamente
- CI/CD automatizado con GitHub Actions y Jenkins

### Pipelines Activos

- **GitHub Actions**: Ejecución automática en cada push y pull request
- **Jenkins**: Pipeline completo para desarrollo y producción
- **SonarQube**: Análisis de calidad en cada commit

### Métricas

- Cobertura de código: Monitoreada en cada build
- Calidad de código: Analizada con SonarQube
- Tests automatizados: Unitarios, E2E y de carga

---

## Glosario Técnico

| Término | Descripción |
|---------|-------------|
| **Node.js** | Entorno de ejecución JavaScript del lado del servidor |
| **PostgreSQL** | Sistema de gestión de bases de datos relacional de código abierto |
| **Express** | Framework web minimalista para Node.js |
| **JWT** | JSON Web Token - Estándar para transmisión segura de información |
| **2FA/TOTP** | Autenticación de dos factores usando Time-based One-Time Password |
| **API** | Application Programming Interface - Interfaz de comunicación entre componentes |
| **Middleware** | Software que procesa solicitudes antes de llegar al controlador |
| **CORS** | Cross-Origin Resource Sharing - Política de seguridad para recursos compartidos |
| **bcrypt** | Algoritmo de hash criptográfico para encriptación de contraseñas |
| **CI/CD** | Continuous Integration / Continuous Deployment - Automatización de pruebas y despliegues |
| **Jest** | Framework de testing unitario para JavaScript |
| **Playwright** | Framework de testing end-to-end para aplicaciones web |
| **SonarQube** | Plataforma de análisis estático de código y calidad |
| **GitHub Actions** | Sistema de automatización de workflows en GitHub |
| **Jenkins** | Servidor de automatización de CI/CD |
| **Docker** | Plataforma de contenedorización de aplicaciones |

---

## Roadmap

### Próximas Mejoras

- Aplicación móvil nativa para Android e iOS
- Sistema de notificaciones push
- Sistema de calificaciones y reseñas de libros
- Chat en tiempo real entre usuarios
- Integración con sistemas de gestión escolar existentes
- Modo offline para consulta de catálogo sin conexión
- Sistema de recomendaciones basado en historial
- Exportación de reportes en múltiples formatos

---

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Cree una rama para su feature (`git checkout -b feature/AmazingFeature`)
3. Commit sus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abra un Pull Request

Asegúrese de que todos los tests pasen y que el código cumpla con los estándares de calidad establecidos.

---

## Licencia

Este proyecto está bajo la Licencia ISC. Consulte el archivo `LICENSE` para más detalles.

---

## Contacto y Soporte

- **Email**: info@xonler.edu
- **Issues**: [GitHub Issues](https://github.com/drakcore12/biblioteca-xonler/issues)
- **Documentación**: Este README

---

**Biblioteca Xonler** - Conectando el conocimiento a través de las bibliotecas escolares

*Última actualización: Diciembre 2024*
