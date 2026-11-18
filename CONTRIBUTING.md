# Contribuir

## Antes de empezar

Lee `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/SECURITY.md` y `docs/TESTING.md`. Mantén el alcance del MVP y las decisiones técnicas acordadas.

## Flujo recomendado

1. Crear una rama enfocada en un cambio (ver [Ramas](#ramas)).
2. Describir el comportamiento esperado y los criterios de aceptación.
3. Implementar con cambios pequeños.
4. Añadir pruebas automatizadas.
5. Ejecutar lint, build y tests relevantes (ver [Comprobaciones locales](#comprobaciones-locales-antes-de-abrir-un-pr)).
6. Actualizar documentación, contratos y migraciones.
7. Abrir un PR con la plantilla (`.github/pull_request_template.md`): resumen, cómo se probó, decisiones y limitaciones.

## Reglas de las pull requests

1. **Una sola finalidad por PR.** Evitar PRs grandes que mezclen refactor, funcionalidad y rediseño; si un cambio crece, dividirlo.
2. **Nada va directo a `master`:** todo entra por PR, también los cambios de documentación.
3. **El título sigue Conventional Commits** (lo valida la CI, ver [Commits y títulos](#commits-y-títulos)).
4. **Se fusiona con *Squash and merge*.** El título del PR es el mensaje del commit en `master`, así que el historial queda lineal, con un commit por cambio. Revisa que el cuerpo del mensaje conserve la descripción útil.
5. **Los checks obligatorios deben estar en verde** antes de fusionar (ver [Checks](#checks-de-un-pr)). No se fusiona con checks en rojo ni se desactivan para que pasen.
6. **Cada cambio lleva sus pruebas** y la documentación afectada (`docs/API.md`, `docs/DATA_MODEL.md`, migraciones, README).
7. **Dependencias y decisiones nuevas se justifican.** No introducir dependencias sin necesidad clara; si se añade una, fijar la versión exacta y registrar la decisión en un ADR (`docs/adr/`). No modificar decisiones de producto o arquitectura sin registrar la propuesta y obtener aprobación.
8. **Los cambios de interfaz incluyen capturas** en tema claro y oscuro (y móvil si afecta al diseño).
9. **Seguridad:** no añadir puertos ni exposición remota, no incluir secretos o datos personales y no registrar contenido de tareas en logs. Cualquier propuesta de LAN o Internet se detiene hasta completar el gate de `docs/SECURITY.md`.
10. **Autorrevisión:** relee tu propio diff y resuelve todas las conversaciones antes de fusionar. No afirmes en el PR que una prueba pasó si no la ejecutaste.

## Checks de un PR

La CI (`.github/workflows/ci.yml`) se ejecuta en cada PR y en cada push a `master`. Estos son los checks y lo que garantizan:

| Check | Qué comprueba |
|---|---|
| `Backend (build, format, tests)` | `dotnet format`, compilación en Release con `-warnaserror` y las pruebas unitarias y de integración |
| `Frontend (lint, types, tests, build)` | ESLint, Prettier, TypeScript estricto, Vitest y `vite build` |
| `E2E (Playwright, real API)` | Flujos completos contra la API real, incluido drag & drop, teclado y axe (WCAG 2.2 AA) en ambos temas |
| `Demo build (E2E without API)` | La build estática de la demo, sin llamadas a `/api` |
| `Docker (build, smoke test, hardening checks)` | Construcción de las imágenes, humo a través de Nginx, persistencia, puertos, usuarios no root, `Host`/`Origin` y Trivy |
| `Dependency audit` | `npm audit` y vulnerabilidades de NuGet |
| `Conventional Commit title` | El título del PR (`.github/workflows/pr-title.yml`) |

Además, al fusionar a `master` se ejecuta `.github/workflows/pages.yml` y publica la demo si cambió `frontend/`.

Si un check falla, corrígelo en la misma rama; no lo ignores. Los E2E guardan las trazas de Playwright como artefacto del job.

## Checklist de pull request

La plantilla del PR la incluye; estos son los criterios de producto que se revisan:

- [ ] Respeta las tres columnas y los estados acordados.
- [ ] Las tareas completadas siguen visibles y se pueden recuperar.
- [ ] Drag & drop y alternativa de teclado funcionan.
- [ ] Fechas y prioridades se validan en servidor.
- [ ] Búsqueda y filtros se pueden combinar.
- [ ] Ambos temas mantienen contraste y legibilidad.
- [ ] Estados loading/error/empty están contemplados.
- [ ] No se introducen puertos ni exposición remota.
- [ ] No se filtran datos de tareas en logs.
- [ ] Pruebas ejecutadas y resultados descritos.
- [ ] Documentación actualizada.

## Ramas

Nombre: `tipo/descripcion-corta` en minúsculas y con guiones, por ejemplo `feat/keyboard-column-navigation`, `fix/demo-banner-mobile` o `docs/pr-template`. Los tipos son los mismos que en los commits. Borra la rama al fusionar.

## Commits y títulos

Seguimos [Conventional Commits](https://www.conventionalcommits.org/): `tipo(ámbito opcional): descripción`.

| Tipo | Cuándo |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un error |
| `docs` | Solo documentación |
| `test` | Solo pruebas |
| `refactor` | Cambio interno sin alterar el comportamiento |
| `perf` | Mejora de rendimiento |
| `style` | Formato sin efecto en el código |
| `build` | Empaquetado, Docker o dependencias |
| `ci` | Workflows de GitHub Actions |
| `chore` | Mantenimiento que no encaja en los demás |
| `revert` | Revierte un commit anterior |

Ámbitos habituales: `api`, `web`, `docker`, `demo`. Descripción en inglés, en imperativo y en minúsculas, de 72 caracteres como máximo (por ejemplo, `feat(web): add keyboard column navigation`). Un cambio incompatible se marca con `!` (`feat(api)!: ...`) y se explica en el cuerpo.

## Protección de `master` (configuración recomendada del repositorio)

*Settings → Branches → Branch protection rule* para `master`:

- Exigir un pull request antes de fusionar (sin push directo, ni siquiera de administradores).
- Exigir que los checks de la tabla anterior pasen y que la rama esté actualizada con `master`.
- Exigir la resolución de todas las conversaciones.
- Exigir historial lineal y permitir únicamente *Squash merge*.
- Bloquear los force-push y el borrado de la rama.
- *Settings → General → Automatically delete head branches*.

## Issues, milestones y roadmap

- **El trabajo pendiente vive en las [issues](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues)**, agrupado en milestones (el actual es la v1.1). `docs/ROADMAP.md` solo recoge la dirección y lo ya entregado: no dupliques tareas allí.
- Abre una issue antes de empezar un cambio grande o que toque decisiones de producto o arquitectura, y enlázala desde el PR con `Closes #n`.
- Usa las plantillas (*Error* y *Mejora o idea*). Etiquetas: `bug`, `enhancement`, `accessibility`, `i18n`, `performance`, `design`, `security`, `chore` e `idea` (sin comprometer, sin milestone).

## Reporte de incidencias

Incluir pasos reproducibles, comportamiento esperado/observado, entorno y logs técnicos depurados (la plantilla *Error* los pide). No adjuntar secretos ni datos personales de tareas.

## Comprobaciones locales antes de abrir un PR

```bash
dotnet format --verify-no-changes && dotnet build -warnaserror && dotnet test
cd frontend && npm run lint && npm run format:check && npm run typecheck && npm test && npm run e2e
```

Si el cambio toca la demo: `npm run e2e:demo`. La CI ejecuta las mismas comprobaciones, más el build de Docker, las comprobaciones de endurecimiento y los escaneos de dependencias e imágenes.
