# Backend - Desarrollo y Producción

## Entorno de Desarrollo

### Características
- **Hot reload automático** con `tsx watch` - cualquier cambio en `src/` se recarga instantáneamente
- Código montado como volumen - editas en local, se refleja en el contenedor
- Logs detallados con `pino-pretty`
- Puerto 3000 expuesto para acceso directo desde el host

### Iniciar desarrollo
```bash
# Windows
.\iniciar_backend_windows.ps1

# Linux/Mac
./iniciar_backend.sh

# O directamente
docker compose -f compose_dev.yaml up
```

### Detener desarrollo
```bash
# Windows
.\detener_backend_windows.ps1

# Linux/Mac
./detener_backend.sh

# O directamente
docker compose -f compose_dev.yaml down
```

### Workflow típico
1. Editas código en `src/` (index.ts, etc.)
2. `tsx watch` detecta cambios y recarga automáticamente
3. Ves los logs en tiempo real
4. No necesitas reconstruir nada

## Entorno de Producción

### Características
- Imagen Docker inmutable con código compilado
- TypeScript compilado a JavaScript (`dist/`)
- Build multi-stage optimizado
- Solo dependencias de producción
- Backend **NO expuesto** públicamente (solo via red interna para Nginx)

### Construir imagen de producción
```bash
docker compose -f compose_prod.yaml build
```

### Iniciar producción
```bash
docker compose -f compose_prod.yaml up -d
```

### Detener producción
```bash
docker compose -f compose_prod.yaml down
```

### Para actualizar código en producción
1. Haces cambios en `src/`
2. Reconstruyes la imagen: `docker compose -f compose_prod.yaml build server`
3. Reinicias: `docker compose -f compose_prod.yaml up -d`

## Scripts disponibles

En `src/package.json`:

- `npm run dev` - Desarrollo con hot reload (tsx watch)
- `npm run build` - Compilar TypeScript a JavaScript
- `npm run start` - Ejecutar versión compilada (producción)
- `npm run db:deploy` - Aplicar migraciones de Prisma

## Arquitectura

### Dev
```
Host (tu máquina)
  └─ src/ ──(montado)──> Contenedor Node
                           └─ tsx watch index.ts
                              └─ Recarga automática
```

### Prod
```
Dockerfile build
  ├─ Compila TypeScript (src/ -> dist/)
  ├─ Genera Prisma Client
  └─ Crea imagen inmutable

Nginx (reverse proxy)
  └─> Backend (server:3000) - Solo red interna
       └─> PostgreSQL
```

## URLs

- **Dev**: http://localhost:3000
- **Prod**: Solo accesible via Nginx (sin puerto expuesto al host)

## Health Check (Todavia no implementado)

```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "ok",
  "database": "connected"
}
```
