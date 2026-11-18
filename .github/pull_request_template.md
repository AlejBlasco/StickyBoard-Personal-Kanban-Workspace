<!--
Título del PR: Conventional Commits, p. ej. `feat(web): add keyboard column navigation`.
Con "Squash and merge" el título pasa a ser el mensaje del commit en master.
Tipos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
-->

## Resumen

<!-- Qué cambia y por qué, en 2-4 líneas. Enlaza la incidencia si existe (Closes #123). -->

## Tipo de cambio

- [ ] `feat`: funcionalidad nueva
- [ ] `fix`: corrección de un error
- [ ] `refactor` / `perf`: sin cambio de comportamiento
- [ ] `test`: solo pruebas
- [ ] `docs`: solo documentación
- [ ] `build` / `ci` / `chore`: empaquetado, CI o mantenimiento

## Cómo se ha probado

<!-- Comandos ejecutados y resultado. No marques una prueba que no hayas ejecutado. -->

- [ ] `dotnet format --verify-no-changes && dotnet build -warnaserror && dotnet test`
- [ ] `npm run lint && npm run format:check && npm run typecheck && npm test` (en `frontend/`)
- [ ] `npm run e2e` y/o `npm run e2e:demo` si toca la interfaz o la API
- [ ] Probado a mano (describe cómo): 

## Capturas o GIF

<!-- Obligatorio si cambia la interfaz: tema claro y oscuro, y móvil si afecta al diseño. Borra la sección si no aplica. -->

## Checklist

**Alcance**
- [ ] El PR tiene un solo propósito (sin mezclar refactor, funcionalidad y rediseño).
- [ ] Incluye pruebas del cambio (unitarias, de integración, de componentes o E2E según corresponda).
- [ ] Actualiza la documentación, el contrato de `docs/API.md`, `docs/DATA_MODEL.md` y las migraciones si procede.
- [ ] Una dependencia o decisión nueva está justificada en un ADR (`docs/adr/`) y con la versión fijada.

**Producto** (`AGENTS.md`)
- [ ] Respeta las tres columnas y los estados acordados; las tareas completadas siguen visibles y recuperables.
- [ ] Drag & drop y su alternativa de teclado funcionan.
- [ ] Fechas, prioridades y colores se validan también en servidor.
- [ ] Ambos temas mantienen contraste y legibilidad; hay estados de carga, error y vacío.

**Seguridad**
- [ ] No añade puertos, acceso remoto ni exposición a LAN o Internet.
- [ ] No registra contenido de tareas en logs ni incluye secretos o datos personales.

## Notas para quien revise

<!-- Decisiones tomadas, limitaciones conocidas, partes en las que quieres una opinión. -->
