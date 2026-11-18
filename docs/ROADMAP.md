# Roadmap

Leyenda: `[x]` hecho y verificado con tests; `[ ]` pendiente (los paréntesis indican lo que ya está hecho y lo que falta).

Estado: MVP funcional completo (backend, frontend, Docker y seguridad) y verificado. Queda una tarea: la revisión manual de accesibilidad con lector de pantalla.

## MVP — alcance comprometido

### Fundación
- [x] Solución .NET 10 (Clean Architecture: Domain, Application, Infrastructure, Api, Tests).
- [x] Frontend React/TypeScript (strict)/Vite en `frontend/`.
- [x] Docker Compose con Nginx, API y volumen SQLite (web solo en `127.0.0.1`, API sin puertos, health checks, contenedores sin root y de solo lectura; verificado en ejecución).
- [x] Configuración de desarrollo, lint y formato (ESLint, Prettier, TypeScript strict, `.gitignore`, `.env.example`).
- [x] CI con GitHub Actions (`.github/workflows/ci.yml`): backend (format, build con `-warnaserror`, 73 tests), frontend (lint, formato, tipos, tests, build), E2E con Playwright, build y humo de Docker con comprobaciones de seguridad, y auditoría de dependencias e imágenes. Verificada en GitHub: los 5 jobs en verde (actions fijadas por SHA y Trivy desde una imagen fijada por digest).

### Tablero
- [x] Columnas Pendiente, En progreso y Completado.
- [x] Crear, editar y eliminar tareas.
- [x] Confirmación antes del borrado permanente.
- [x] Drag & drop entre columnas y reordenación (dnd-kit, con alternativa por teclado y menú «Mover a»).
- [x] Persistencia del orden.

### Tareas
- [x] Título obligatorio y descripción opcional.
- [x] Prioridad baja, media y alta.
- [x] Color de tarjeta.
- [x] Fecha límite opcional.
- [x] Fechas de creación y actualización.
- [x] Tareas completadas visibles y recuperables.

### Productividad
- [x] Búsqueda por título y descripción.
- [x] Filtros por estado, prioridad y fecha límite.
- [x] Temas claro y oscuro.
- [x] Estados vacíos, loading, error y vencimiento.

### Calidad
- [x] Pruebas de integración backend (21 tests: CRUD, movimiento, filtros, Problem Details, `Host` y `Origin`).
- [x] Pruebas unitarias backend (52 tests de `TaskItem` y `TaskService` con repositorio y reloj falsos: validación, límites, movimiento y posiciones, filtros y `today` local).
- [x] Pruebas de componentes frontend (Vitest + RTL, 27 tests).
- [x] Flujos E2E principales (Playwright contra la API real, 8 tests).
- [x] Accesibilidad automatizada WCAG 2.2 AA (axe sin violaciones serias en ambos temas, teclado y anuncios de arrastre verificados, objetivos táctiles y reflow móvil).
- [ ] Revisión manual de accesibilidad con lector de pantalla, zoom y reflow.
- [x] Revisión de seguridad y dependencias (`npm audit` y NuGet sin vulnerabilidades, Trivy sin HIGH/CRITICAL corregibles en ambas imágenes, versiones fijadas, CSP y cabeceras en Nginx, validación de `Host` y `Origin`, permisos `700`/`600`; la revisión OWASP ASVS completa queda para el gate de exposición remota).
- [x] Documentación de ejecución y backup (README y `docs/DEPLOYMENT.md`; backup y restauración probados).

## Próximo trabajo

- [x] Demo pública sin backend (modo demo con datos en el navegador, workflow de GitHub Pages y E2E propio; [ADR 0003](adr/0003-demo-mode.md)). Desplegada y verificada en https://alejblasco.github.io/StickyBoard-Personal-Kanban-Workspace/ (carga, CRUD y persistencia tras recargar, sin llamadas a `/api` ni errores de consola).
- [ ] Hacer multi idioma (hoy la interfaz está solo en español).

## Después del MVP (no comprometido)

Posibles mejoras sujetas a priorización:
- Etiquetas y categorías.
- Varias vistas y calendarios.
- Tareas recurrentes.
- Adjuntos.
- Múltiples tableros.
- Importación/exportación.
- Atajos de teclado avanzados.

## Futuro remoto

Sincronización, multiusuario o acceso remoto son proyectos separados. Requieren definir identidad, autorización, modelo de amenazas, migración de datos y estrategia de despliegue seguro. No deben introducirse como una simple opción de configuración.
