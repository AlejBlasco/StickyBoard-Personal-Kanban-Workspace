# API REST

## Convenciones

Base path: `/api/v1`. JSON en camelCase. Los errores usan `application/problem+json` conforme a RFC 9457. La API no debe exponer entidades EF Core.

## Modelo de tarea (DTO)

```json
{
  "id": "uuid",
  "title": "Preparar demo",
  "description": "Revisar el flujo principal",
  "status": "todo",
  "priority": "medium",
  "color": "lavender",
  "dueDate": "2026-11-20",
  "position": 1024,
  "createdAt": "2026-11-18T10:00:00Z",
  "updatedAt": "2026-11-18T10:00:00Z"
}
```

`dueDate` es una fecha ISO `YYYY-MM-DD` sin zona horaria. `createdAt` y `updatedAt` son instantes UTC.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/tasks` | Listar tareas con búsqueda y filtros |
| GET | `/tasks/{id}` | Obtener tarea |
| POST | `/tasks` | Crear tarea |
| PUT | `/tasks/{id}` | Actualizar campos editables |
| DELETE | `/tasks/{id}` | Borrado permanente |
| PATCH | `/tasks/{id}/position` | Cambiar estado/posición |
| GET | `/health` | Health check técnico (`/api/v1/health`) |

## Filtros de listado

`GET /tasks?q=texto&status=todo&priority=high&due=overdue&dueFrom=2026-11-01&dueTo=2026-11-30`

- `q`: búsqueda en título y descripción.
- `status`: `todo`, `inProgress`, `done`.
- `priority`: `low`, `medium`, `high`.
- `due`: filtro semántico acordado (por ejemplo `overdue`, `today`, `upcoming`, `none`).
- `dueFrom`, `dueTo`: rango inclusivo de fechas ISO.

Los filtros deben poder combinarse.

Semántica de `due` (con `today` = parámetro opcional `today=YYYY-MM-DD` enviado por el cliente con su fecha local; si falta, fecha local de la máquina del servidor):
- `overdue`: `dueDate < today` y `status != done`.
- `today`: `dueDate == today`.
- `upcoming`: `today < dueDate <= today + 7 días`.
- `none`: sin `dueDate`.

Límites: `title` ≤ 120 caracteres, `description` ≤ 2000, body ≤ 16 KB. Colores permitidos: `lavender` (por defecto), `mint`, `peach`, `sky`, `lemon`, `rose`.

## Crear/actualizar

Campos editables:
- `title` obligatorio, con longitud máxima documentada.
- `description` opcional y limitada.
- `priority` enumeración cerrada.
- `color` valor de una paleta permitida.
- `dueDate` opcional en formato `YYYY-MM-DD`.
- `status` es opcional al crear (por defecto `todo`); después solo cambia mediante `PATCH /tasks/{id}/position`. `PUT` no lo modifica.

## Movimiento y orden

`PATCH /tasks/{id}/position` recibe `{ "status": "todo|inProgress|done", "index": 0 }`, donde `index` es el índice destino (base 0) dentro de la columna destino sin contar la tarea movida. Si `index` supera el tamaño de la columna, se coloca al final; si es negativo, `400`. La operación es atómica: el servidor reordena la columna y reasigna `Position` en saltos de 1024. Devuelve `200` con la tarea actualizada.

## Códigos de respuesta

- `200`: lectura/actualización correcta.
- `201`: creación correcta.
- `204`: borrado correcto.
- `400`: entrada inválida (también `Host` no permitido, enumeraciones o JSON mal formados).
- `403`: escritura con cabecera `Origin` no incluida en `Security:AllowedOrigins`.
- `413`: body superior a 16 KB.
- `404`: tarea inexistente.
- `409`: conflicto de estado/posición si aplica.
- `500`: error inesperado, sin detalles internos.

## Requisitos

- Validación server-side.
- Límites de tamaño de request.
- DTOs explícitos.
- No confiar en `id`, `position` o enumeraciones del cliente.
- Errores con Problem Details.
