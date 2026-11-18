# Contribuir

## Antes de empezar

Lee `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/SECURITY.md` y `docs/TESTING.md`. Mantén el alcance del MVP y las decisiones técnicas acordadas.

## Flujo recomendado

1. Crear una rama enfocada en un cambio.
2. Describir el comportamiento esperado y los criterios de aceptación.
3. Implementar con cambios pequeños.
4. Añadir pruebas automatizadas.
5. Ejecutar lint, build y tests relevantes.
6. Actualizar documentación, contratos y migraciones.
7. Abrir PR con resumen, decisiones y limitaciones.

## Checklist de pull request

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

## Estilo de cambios

Evitar PRs grandes que mezclen refactor, funcionalidad y rediseño. No introducir dependencias sin justificación. No modificar decisiones de producto o arquitectura sin registrar la propuesta y obtener aprobación.

## Reporte de incidencias

Incluir pasos reproducibles, comportamiento esperado/observado, entorno y logs técnicos depurados. No adjuntar secretos ni datos personales de tareas.

## Comprobaciones locales antes de abrir un PR

```bash
dotnet format --verify-no-changes && dotnet build -warnaserror && dotnet test
cd frontend && npm run lint && npm run format:check && npm run typecheck && npm test && npm run e2e
```

La CI (`.github/workflows/ci.yml`) ejecuta las mismas comprobaciones, más el build de Docker, las comprobaciones de endurecimiento y los escaneos de dependencias e imágenes.
