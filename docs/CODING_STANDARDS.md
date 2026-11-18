# Estándares de código

## General

- Código legible, explícito y orientado a responsabilidades.
- Preferir soluciones simples a abstracciones prematuras.
- Evitar duplicación real, no abstraer por anticipado.
- Mantener cambios acotados y añadir pruebas con cada funcionalidad.

## TypeScript y React

- Activar `strict` y resolver errores de tipos; evitar `any`.
- Componentes funcionales y hooks con responsabilidades claras.
- No colocar reglas de negocio complejas dentro de componentes de presentación.
- Tipar DTOs y respuestas de API.
- Gestionar estados de carga, error y vacío.
- No confiar en validación de frontend como control de seguridad.
- Mantener accesibilidad semántica y foco gestionado.

## C# y .NET

- Usar nullable reference types.
- Preferir async/await para I/O y propagar `CancellationToken`.
- DTOs separados de entidades EF.
- Validar límites y enumeraciones en servidor.
- No filtrar excepciones internas ni stack traces al cliente.
- Usar Problem Details para errores HTTP.
- Mantener lógica de dominio independiente de infraestructura cuando sea razonable.

## Datos y fechas

- `CreatedAt` y `UpdatedAt` se almacenan como instantes UTC.
- `DueDate` es `DateOnly`, una fecha de calendario sin zona horaria.
- Aplicar migraciones versionadas.
- Usar índices justificados por consultas reales.
- La eliminación es permanente en el MVP; no introducir soft delete sin decisión explícita.

## UI y diseño

- Seguir tokens de `DESIGN.md`.
- Personalizar shadcn/ui; no aceptar el tema por defecto sin revisión.
- Usar Lucide para iconografía consistente.
- Motion debe mejorar feedback, no retrasar interacciones.
- Respetar `prefers-reduced-motion`.
- Mantener equivalencia entre temas claro y oscuro.

## Drag & drop

- Usar identificadores estables, no índices como identidad.
- Mantener soporte de teclado y anunciar cambios relevantes.
- Actualización optimista con rollback si falla la API.
- El servidor valida destino y posición.

## Dependencias

- Añadir una dependencia solo si resuelve una necesidad clara.
- Fijar versiones y revisar changelog, mantenimiento y vulnerabilidades.
- No introducir paquetes abandonados o redundantes.
