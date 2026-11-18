# AGENTS.md — Instrucciones para agentes de desarrollo

## Objetivo

Implementar StickyBoard como aplicación Kanban local, robusta, accesible y visualmente cuidada. Estas reglas son invariantes del producto.

## Invariantes funcionales

- Las columnas son `todo`, `inProgress` y `done`, presentadas como Pendiente, En progreso y Completado.
- Una tarea completada permanece visible; no se archiva ni desaparece automáticamente.
- El usuario puede mover una tarea desde Completado a cualquier otra columna.
- Drag & drop permite cambiar de columna y ordenar dentro de una columna.
- La fecha límite es opcional. La prioridad es baja, media o alta.
- La búsqueda cubre título y descripción; los filtros cubren estado, prioridad y fecha límite.
- El borrado es permanente y siempre exige confirmación.
- Cada instalación usa su propia SQLite. No implementar sincronización implícita.

## Reglas técnicas

- Frontend React + TypeScript en modo estricto; Vite, Tailwind, shadcn/ui + Radix, Lucide, Motion y dnd-kit.
- Backend ASP.NET Core .NET 10, REST y EF Core con SQLite.
- Mantener separación entre presentación, lógica de aplicación y persistencia.
- Validar toda entrada en servidor, aunque exista validación en cliente.
- Usar DTOs explícitos; no exponer entidades EF directamente.
- Manejar errores de API con Problem Details (RFC 9457).
- Persistir posiciones de forma determinista y evitar duplicados/inconsistencias al mover tarjetas.

## Diseño y accesibilidad

- Seguir `docs/DESIGN.md`; no dejar componentes shadcn/ui con apariencia predeterminada.
- Diseñar estados loading, empty, error, hover, focus, disabled y overdue.
- El drag & drop debe tener alternativa por teclado y controles accesibles.
- Cumplir WCAG 2.2 AA como objetivo de aceptación.
- Mantener paridad funcional y contraste suficiente en ambos temas.

## Seguridad

- Mantener el modo local-only y el binding de host en loopback.
- No añadir autenticación ficticia ni considerar CORS como mecanismo de autenticación.
- No publicar el puerto de la API al host.
- No habilitar acceso remoto, LAN, túneles ni reverse proxy sin completar el gate de `docs/SECURITY.md`.
- No registrar descripciones o contenido de tareas innecesariamente.

## Flujo de trabajo

1. Leer `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md` y `docs/DESIGN.md`.
2. Implementar cambios pequeños y verificables.
3. Añadir o actualizar pruebas en el mismo cambio.
4. Ejecutar build, tests y comprobaciones de formato.
5. Actualizar documentación y migraciones cuando proceda.
6. No afirmar que una prueba se ejecutó si no se ejecutó realmente.
