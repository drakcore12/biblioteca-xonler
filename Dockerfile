# ---------- Build stage ----------
FROM node:20-alpine3.20 AS build

WORKDIR /app

# Actualizar paquetes de Alpine y instalar dependencias necesarias
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Instala dependencias (incluyendo dev dependencies para build)
COPY package*.json ./
RUN npm ci && \
    npm cache clean --force

# Copia el resto del código
COPY . .

# No hay build step de frontend (archivos estáticos se sirven directamente)

# ---------- Runtime stage ----------
FROM node:20-alpine3.20 AS runtime

WORKDIR /app

# Actualizar paquetes de Alpine y instalar solo lo necesario para runtime
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Variables por defecto (puedes sobreescribir en compose/.env)
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NODE_OPTIONS="--enable-source-maps"

# Solo deps de prod para imagen mínima
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copia código desde build stage (solo lo necesario para runtime)
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Seguridad básica: crear usuario no root
RUN addgroup -S nodegrp && \
    adduser -S nodeusr -G nodegrp && \
    chown -R nodeusr:nodegrp /app

USER nodeusr

EXPOSE 3000

# Health check para verificar que el servidor está funcionando
# Usa el puerto por defecto 3000, pero puede ser sobrescrito por docker-compose
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || '3000') + '/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar el servidor (usa --enable-source-maps como en package.json)
CMD ["node", "--enable-source-maps", "src/server.js"]

