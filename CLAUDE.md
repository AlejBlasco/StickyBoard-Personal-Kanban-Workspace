# CLAUDE.md — Guía de trabajo para Claude Code

## Misión

Construir StickyBoard conforme a las decisiones cerradas en esta documentación. Antes de modificar código, inspecciona el repositorio y respeta las convenciones existentes. No inventes requisitos ni cambies el stack sin autorización.

## Lectura obligatoria

Lee `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/API.md`, `docs/DESIGN.md`, `docs/TESTING.md` y `docs/SECURITY.md` antes de iniciar una fase relevante.

## Decisiones que no debes alterar

- Frontend: React + TypeScript + Vite.
- Backend: ASP.NET Core .NET 10.
- Persistencia: SQLite + EF Core.
- UI: Tailwind, shadcn/ui + Radix personalizados, Lucide y Motion.
- Drag & drop: dnd-kit, incluido en el MVP.
- Columnas: Pendiente, En progreso y Completado.
- Completadas visibles y recuperables.
- Fecha límite, prioridad, búsqueda y filtros incluidos en el MVP.
- Temas claro y oscuro desde el inicio.
- Instalaciones locales independientes; no hay sincronización.

## Plan de implementación sugerido

> Las fases 1–7 están completadas. La dirección y lo entregado están en `docs/ROADMAP.md`; el trabajo pendiente vive en las issues y milestones del repositorio de GitHub.

### Fase 1 — Fundación
- Crear solución .NET y aplicación React/TypeScript.
- Configurar lint, format, TypeScript strict y pruebas.
- Definir Docker Compose y configuración por entorno.

### Fase 2 — Backend y persistencia
- Crear modelo Task, DbContext y migración inicial.
- Implementar endpoints CRUD, filtros y movimiento/reordenación.
- Añadir validación, Problem Details y pruebas de integración.

### Fase 3 — Sistema visual
- Definir tokens para tema claro/oscuro.
- Construir layout, cabecera, tablero, columnas, tarjetas y diálogos.
- Personalizar los componentes; evitar el aspecto genérico de un kit.

### Fase 4 — Flujo Kanban
- Implementar crear, editar y eliminar con confirmación.
- Integrar dnd-kit para mover y reordenar.
- Aplicar actualización optimista con rollback ante fallo de API.

### Fase 5 — Productividad
- Añadir fecha límite, indicadores de vencimiento y prioridad.
- Implementar búsqueda y filtros combinables.
- Asegurar que Completado conserva y permite recuperar tareas.

### Fase 6 — Calidad
- Añadir pruebas unitarias, integración, componentes y E2E.
- Revisar teclado, lectores de pantalla, touch, responsive y ambos temas.
- Ejecutar análisis de dependencias y revisión de seguridad.

### Fase 7 — Empaquetado
- Completar Docker Compose, persistencia del volumen y health checks.
- Publicar solo la web en `127.0.0.1`.
- Verificar que la API no tiene puertos publicados al host.

## Criterios de implementación

- No mezclar lógica de negocio con componentes visuales.
- No usar `any` salvo justificación documentada y acotada.
- Validar también en servidor.
- Usar UTC para timestamps; `DueDate` es una fecha de calendario (`DateOnly`), no un instante UTC.
- Mantener posiciones estables al mover tareas.
- Evitar dependencias innecesarias.
- Toda interacción importante debe tener estados de carga, error y confirmación.
- Para cada cambio, explica brevemente archivos afectados y pruebas ejecutadas.

## Seguridad y exposición

El producto es local-only en el MVP. No abras puertos adicionales ni habilites acceso remoto. Cualquier propuesta de LAN/Internet debe detenerse hasta que se implemente el gate completo de `docs/SECURITY.md`.
