# Roadmap

Este documento recoge la **dirección** del producto y lo que ya se ha entregado. El trabajo pendiente vive en GitHub y es la única fuente de verdad:

- [Issues abiertas](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues) · [Milestone v1.1](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/milestone/1) · etiquetas `bug`, `enhancement`, `accessibility`, `i18n`, `performance`, `design`, `security`, `chore` e `idea`.
- Cómo proponer o reportar algo: [CONTRIBUTING.md](../CONTRIBUTING.md) (hay plantillas de issue y de pull request).

## Estado

**v1.0 (MVP) completo y verificado:** backend, frontend, empaquetado Docker, seguridad, CI y demo pública. El siguiente hito es la **v1.1**, centrada en multi idioma y pulido.

## Entregado en el MVP (v1.0)

**Fundación**
- Solución .NET 10 con Clean Architecture (Domain, Application, Infrastructure, Api) y frontend React + TypeScript (strict) + Vite.
- Docker Compose con Nginx, API y volumen SQLite: web solo en `127.0.0.1`, API sin puertos publicados, contenedores sin root y de solo lectura, health checks. Ver [DEPLOYMENT.md](DEPLOYMENT.md).
- Lint, formato y CI con GitHub Actions (backend, frontend, E2E, demo, Docker con comprobaciones de endurecimiento, auditoría de dependencias y título del PR).

**Tablero y tareas**
- Tres columnas (Pendiente, En progreso y Completado), CRUD con confirmación de borrado y persistencia del orden.
- Drag & drop con dnd-kit, con alternativa por teclado y menú «Mover a»; las tareas completadas siguen visibles y recuperables.
- Título, descripción, prioridad, color, fecha límite y timestamps.

**Productividad y diseño**
- Búsqueda por título y descripción y filtros combinables por estado, prioridad y fecha.
- Temas claro y oscuro, responsive, y estados de carga, vacío, error y vencimiento.

**Calidad y seguridad**
- Pruebas unitarias y de integración (backend), de componentes (frontend) y E2E con Playwright, con axe (WCAG 2.2 AA) en ambos temas. Ver [TESTING.md](TESTING.md).
- Revisión de seguridad y dependencias: CSP y cabeceras en Nginx, validación de `Host` y `Origin`, versiones fijadas y Trivy. Ver [SECURITY.md](SECURITY.md).

**Portfolio**
- Demo pública sin backend en GitHub Pages ([ADR 0003](adr/0003-demo-mode.md)), README con capturas y GIF, diagramas Mermaid y reglas de contribución con protección de `master`.

## Siguiente: v1.1 (multi idioma y pulido)

| Issue | Tema |
|---|---|
| [#5](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/5) | Multi idioma (español e inglés) |
| [#6](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/6) | Revisión manual de accesibilidad con lector de pantalla |
| [#7](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/7) | Teclado: pasar de columna con una sola flecha |
| [#8](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/8) | Soltar bajo la última tarjeta de otra columna |
| [#9](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/9) | Reducir el tamaño del bundle |
| [#10](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/10) | Identidad visual: favicon, logotipo y social preview |
| [#11](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/11) | Permisos de la base de datos en volúmenes existentes |

## Ideas (no comprometidas)

Se priorizan según el uso real y no tienen milestone. Las que ya tienen discusión abierta:

- [#12](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/12) Paleta de comandos (Ctrl+K) y atajos de teclado.
- [#13](https://github.com/AlejBlasco/StickyBoard-Personal-Kanban-Workspace/issues/13) Exportar e importar tareas en JSON.

Sin issue todavía: etiquetas y categorías, varias vistas y calendarios, tareas recurrentes, adjuntos y múltiples tableros. Si te interesa alguna, abre una issue con la plantilla de mejora.

## Futuro remoto

Sincronización, multiusuario o acceso remoto son proyectos separados. Requieren definir identidad, autorización, modelo de amenazas, migración de datos y estrategia de despliegue seguro. No deben introducirse como una simple opción de configuración.
