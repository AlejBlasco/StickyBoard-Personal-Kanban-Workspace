# StickyBoard

**StickyBoard** es un tablero personal Kanban y un proyecto de portfolio profesional. El MVP se ejecuta localmente, con una instalación independiente y una base de datos SQLite propia en cada máquina.

## Producto

StickyBoard permite organizar tareas en tres columnas:

- **Pendiente** (`todo`)
- **En progreso** (`inProgress`)
- **Completado** (`done`)

Las tarjetas permanecen en Completado hasta que el usuario las elimine o las mueva a otro estado. Se pueden crear, editar, reordenar y mover mediante drag & drop. El MVP incluye fechas límite, prioridades, colores, búsqueda y filtros.

### Datos de una tarea

- Título obligatorio y descripción opcional.
- Estado y prioridad (`low`, `medium`, `high`).
- Color de tarjeta.
- Fecha límite opcional.
- Fechas de creación y última actualización.
- Posición dentro de la columna.

La eliminación es permanente y requiere confirmación explícita.

## Stack acordado

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Componentes | shadcn/ui + Radix UI, personalizados |
| Iconos | Lucide |
| Animación | Motion |
| Drag & drop | dnd-kit |
| Estado de servidor | TanStack Query (ver [ADR 0001](docs/adr/0001-tanstack-query.md)) |
| Backend | ASP.NET Core .NET 10 |
| Persistencia | SQLite + Entity Framework Core |
| API | REST |
| Contenedor web | Nginx |
| Orquestación | Docker Compose |
| Pruebas | xUnit, Vitest + Testing Library, Playwright + axe |
| CI | GitHub Actions |

## Funcionalidad MVP

1. Tablero Kanban con las tres columnas acordadas.
2. CRUD de tareas.
3. Drag & drop entre columnas y reordenación dentro de una columna.
4. Fecha límite opcional y prioridad baja, media o alta.
5. Búsqueda por título y descripción.
6. Filtros por estado, prioridad y fecha límite.
7. Tareas completadas visibles y recuperables.
8. Temas claro y oscuro desde el inicio.
9. Persistencia local en SQLite.
10. Diseño responsive y accesible.

## Ejecución y límites de seguridad

El MVP es **local-only**. La interfaz se publica únicamente en `127.0.0.1`; la API no se publica directamente en el host y solo es accesible desde la red interna de Docker Compose. Cada máquina mantiene su propia base SQLite: no existe sincronización entre instalaciones.

No se debe exponer a LAN, Internet, reverse proxy ni Cloudflare Tunnel hasta completar el trabajo de seguridad descrito en [docs/SECURITY.md](docs/SECURITY.md), incluyendo autenticación, autorización y controles de origen.

## Ejecución con Docker

```bash
docker compose up -d --build   # http://127.0.0.1:8080
```

Detalles de seguridad, persistencia, backup y restauración en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Desarrollo local

Requisitos: .NET 10 SDK y Node.js LTS.

```bash
# API (http://localhost:5000, SQLite en data/stickyboard.db)
dotnet run --project src/StickyBoard.Api --urls http://127.0.0.1:5000

# Frontend (http://127.0.0.1:5173, proxy de /api hacia la API)
cd frontend && npm install && npm run dev
```

Pruebas: `dotnet test` (backend), `npm test` (componentes) y `npm run e2e` (Playwright; arranca su propia API con una base temporal).

## Documentación

Consulta [docs/INDEX.md](docs/INDEX.md) para navegar por arquitectura, diseño, API, modelo de datos, pruebas, seguridad y contribución.
