# Fuelogistics

Fuelogistics es una aplicación full-stack para la gestión logística de camiones de combustible, conductores y viajes, desarrollada con React, TypeScript, Express y MongoDB. Incluye autenticación, panel de control, gestión de viajes, conductores y reportes, con despliegue listo para Docker.

## Características principales

- **Autenticación de usuarios** (registro, login, sesiones seguras)
- **Gestión de viajes**: crear, editar, cancelar y visualizar viajes de combustible
- **Gestión de conductores**: CRUD de conductores
- **Dashboard**: estadísticas en tiempo real, filtros y exportación de datos
- **Notificaciones en tiempo real** (WebSocket)
- **Validación robusta** (Zod, validaciones backend y frontend)
- **Despliegue con Docker Compose** (multi-contenedor: frontend, backend, MongoDB)

## Estructura del proyecto

```
Fuelogistics/
├── client/                # Frontend React + Vite
│   └── src/
│       └── components/    # Componentes UI y páginas
├── server/                # Backend Express
├── shared/                # Schemas y validaciones compartidas
├── docker-compose.yml     # Configuración multi-contenedor
├── Dockerfile             # Build de frontend
└── README.md
```

## Requisitos previos
- Docker y Docker Compose
- Node.js 18+ (solo para desarrollo local sin Docker)

## Despliegue rápido con Docker Compose

1. Clona el repositorio:
   ```sh
   git clone <repo-url>
   cd Fuelogistics
   ```
2. Copia o ajusta variables de entorno si es necesario (por defecto funciona localmente).
3. Levanta todos los servicios:
   ```sh
   docker-compose up --build
   ```
4. Accede a la app en [http://localhost:3000](http://localhost:3000)

## Despliegue en producción

1. Edita `docker-compose.prod.yml` y variables de entorno según tu entorno.
2. Ejecuta:
   ```sh
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

## Desarrollo local (sin Docker)

1. Instala dependencias:
   ```sh
   npm install
   cd client && npm install
   ```
2. Inicia MongoDB localmente (o usa Docker solo para la base de datos).
3. Inicia el backend:
   ```sh
   npm run dev:server
   ```
4. En otra terminal, inicia el frontend:
   ```sh
   cd client
   npm run dev
   ```

## Variables de entorno
- Verifica los archivos `.env` y `.env.example` para configuración de MongoDB, puertos, etc.

## Funcionalidades técnicas
- **Stack:** React + Vite + Tailwind, Express, MongoDB, Zod, TanStack Query
- **Autenticación:** Sesiones seguras con cookies y almacenamiento en MongoDB
- **Validación:** Zod (frontend y backend)
- **WebSocket:** Actualización en tiempo real de viajes
- **Docker:** Multi-stage build, persistencia de datos

## Scripts útiles
- `docker-compose up --build` — Despliegue local completo
- `npm run dev:server` — Solo backend en modo desarrollo
- `cd client && npm run dev` — Solo frontend en modo desarrollo

## Contacto y soporte
Para dudas o soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.
