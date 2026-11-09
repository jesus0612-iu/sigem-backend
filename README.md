# SIGEM - Backend

## Arranque
1. `cp .env.example .env` y ajusta credenciales de MySQL
2. Ejecuta `schema.sql` en MySQL
3. `npm install`
4. `npm run seed` (crea admin@sigem.com / Admin12345)
5. `npm run dev`

## Pruebas rápidas en Postman (cada una es una EVIDENCIA para el documento)
1. POST /api/auth/login -> 200 con token
2. POST /api/auth/login con clave mala -> 401
3. POST /api/equipos (Bearer token) -> 201
4. GET /api/equipos?estado=operativo -> 200
5. POST /api/mantenimientos -> 201
6. GET /api/equipos/1/historial y /costos -> 200
7. GET /api/dashboard -> 200 (con token de técnico debe dar 403)
8. Cualquier ruta sin token -> 401

## Flujo Git (evidencia de commits)
`git checkout -b develop` -> una rama `feature/...` por módulo -> commit con mensaje claro -> merge a develop.
