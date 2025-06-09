# Biblioteca Xonler

Aplicación Node.js para gestionar bibliotecas y préstamos de libros. Utiliza Express y PostgreSQL.

## Instalación

1. Instala las dependencias:

```bash
npm install
```

2. Copia el archivo `.env.example` a `.env` y rellena tus credenciales de base de datos.

3. Ejecuta la aplicación:

```bash
node app.js
```

El servidor imprimirá la configuración de PostgreSQL e intentará conectarse al iniciar. Fallará si faltan variables de entorno.

## Variables de entorno

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT` (por defecto 5432)
- `DB_SSL`  (`true` o `false`)

Si tu servidor PostgreSQL no admite SSL (p.ej. una instancia local), establece `DB_SSL=false` para desactivar la encriptación.

## Pruebas

Ejecuta `npm test` para comprobar la conexión a la base de datos.

## Dashboard de administración

El panel en `pages/admin/index.html` ya no usa datos de ejemplo. Al cargarse,
`js/admin/modules/dashboard.js` solicita información a `/api/dashboard` y
muestra los totales de libros, bibliotecas, préstamos y usuarios junto con los
últimos préstamos registrados en la base de datos.

