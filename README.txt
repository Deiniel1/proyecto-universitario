
EmprendeSoacha - Starter Pack
============================

Este paquete contiene un backend mínimo (Node.js + Express + SQLite) y un frontend esqueleto (Vite + React)
pensado para arrancar rápido en local sin costos.

Archivos incluidos:
- backend/: servidor Express (server.js), .env.example, package.json
- frontend/: Vite + React skeleton (index.html, src/, package.json)

IMPORTANTE: Este proyecto fue creado tomando como referencia tu propuesta y el PDF que proporcionaste
(desarrollo hibrido.pdf). Aún falta diseño, validaciones y refinamientos, pero esto te da un punto de partida.

Pasos para ejecutar (en dos terminales):

1) Backend
cd backend
npm install
cp .env.example .env
# editar .env si deseas
npm run dev

2) Frontend
cd frontend
npm install
npm run dev

Frontend estará en http://localhost:5173 y backend en http://localhost:4000

Si quieres, ahora mismo puedo comprimir esto en un único ZIP y darte el enlace de descarga.
