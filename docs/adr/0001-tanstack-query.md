# ADR 0001 — TanStack Query para el estado de servidor

- **Estado:** aceptada (añadida durante la implementación del frontend).
- **Contexto:** `ARCHITECTURE.md` exige separar el estado de servidor del de interfaz, con actualización optimista y rollback al mover tarjetas. El stack acordado no incluía una librería para ello.
- **Decisión:** usar `@tanstack/react-query` para listado, mutaciones, invalidación y la actualización optimista de `useMoveTask`.
- **Alternativas:** `fetch` + `useEffect` + estado manual (más código propio para caché, cancelación y rollback).
- **Consecuencias:** una dependencia más (mantenida, sin vulnerabilidades conocidas, versión fijada). La lógica de negocio sigue en funciones puras fuera de los componentes.
