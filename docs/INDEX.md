# StickyBoard — Índice de documentación

<text>Versión de documentación: 2.0</text>

## Documentos

| Archivo | Contenido |
|---|---|
| [README.md](../README.md) | Visión del producto, stack y alcance MVP |
| [AGENTS.md](../AGENTS.md) | Instrucciones e invariantes para agentes |
| [CLAUDE.md](../CLAUDE.md) | Flujo de trabajo para Claude Code |
| [SECURITY.md](SECURITY.md) | Modelo de amenazas, controles y gate de exposición |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura de frontend, API y persistencia |
| [ROADMAP.md](ROADMAP.md) | Backlog MVP y posibles evoluciones |
| [TESTING.md](TESTING.md) | Estrategia y criterios de pruebas |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Estándares React, TypeScript, C# y datos |
| [DESIGN.md](DESIGN.md) | Dirección visual Creative Workspace |
| [API.md](API.md) | Contrato REST implementado |
| [DATA_MODEL.md](DATA_MODEL.md) | Modelo Task y reglas de persistencia |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Docker Compose, endurecimiento, backup y restauración |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Flujo de contribución y checklist |

## Decisiones consolidadas

- Producto: tablero personal Kanban y portfolio profesional.
- Columnas: Pendiente, En progreso y Completado.
- Las tareas completadas permanecen visibles y se pueden recuperar.
- Drag & drop desde el MVP.
- Fecha límite opcional, prioridad baja/media/alta, color y timestamps.
- Búsqueda por título/descripción; filtros por estado, prioridad y fecha límite.
- Borrado permanente con confirmación.
- Frontend React + TypeScript + Vite.
- Tailwind CSS, shadcn/ui + Radix personalizados, Lucide, Motion y dnd-kit.
- Backend ASP.NET Core .NET 10; REST; EF Core + SQLite.
- Nginx y Docker Compose.
- Temas claro y oscuro desde el inicio.
- Cada máquina tiene su propia base de datos; no hay sincronización.
- MVP local-only: web ligada a `127.0.0.1`; API sin puerto publicado al host.
- No habilitar acceso remoto hasta completar autenticación, autorización y el gate de seguridad.

## Nota de alcance

El MVP está implementado: backend en `src/`, frontend en `frontend/`, empaquetado en `docker-compose.yml` y `docker/`, y CI en `.github/workflows/ci.yml`. Los contratos de `API.md` y `DATA_MODEL.md` describen la implementación real y están cubiertos por pruebas. El estado detallado y lo pendiente están en [ROADMAP.md](ROADMAP.md); las decisiones añadidas durante la implementación, en [adr/](adr/).
