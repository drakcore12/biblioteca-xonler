# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Actualizar paquetes de Alpine (incluyendo busybox) para corregir CVEs
RUN apk update && apk upgrade && apk add --no-cache curl

# Instala dependencias (separando deps de producción)
COPY package*.json ./
RUN npm ci

# Copia el resto del código
COPY . .

# No hay build step de frontend (archivos estáticos se sirven directamente)

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime

WORKDIR /app

# Actualizar paquetes de Alpine (incluyendo busybox) para corregir CVEs
RUN apk update && apk upgrade && apk add --no-cache curl

# Variables por defecto (puedes sobreescribir en compose/.env)
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Solo deps de prod para imagen mínima
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copia código desde build stage
COPY --from=build /app ./

# Seguridad básica: crear usuario no root
RUN addgroup -S nodegrp && \
    adduser -S nodeusr -G nodegrp && \
    chown -R nodeusr:nodegrp /app

USER nodeusr

EXPOSE 3000

# Health check para verificar que el servidor está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar el servidor (usa --enable-source-maps como en package.json)
CMD ["node", "--enable-source-maps", "src/server.js"]

