# ADR 0002 — Validación de `Origin` en la API

- **Estado:** aceptada.
- **Contexto:** `SECURITY.md` exige protección frente a acceso cross-origin y DNS rebinding a servicios locales, sin autenticación en el MVP.
- **Decisión:** middleware `OriginGuard`: las peticiones que modifican datos con una cabecera `Origin` fuera de `Security:AllowedOrigins` reciben `403` (Problem Details). Las peticiones sin `Origin` y las lecturas pasan. Docker Compose configura los orígenes según `STICKYBOARD_PORT`. No se habilita CORS.
- **Alternativas:** confiar solo en `AllowedHosts` y en la ausencia de CORS (no cubre bien los orígenes locales hostiles).
- **Consecuencias:** defensa en profundidad, no autenticación. Cualquier exposición remota sigue bloqueada por el gate de `SECURITY.md`.
