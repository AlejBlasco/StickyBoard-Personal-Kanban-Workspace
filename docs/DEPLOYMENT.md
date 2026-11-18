# Despliegue local

## Topología

`docker-compose.yml` (raíz del repo) define dos servicios y un volumen:

| Servicio | Imagen | Qué hace | Red |
|---|---|---|---|
| `web` | Nginx sin privilegios (`docker/web.Dockerfile`) | Sirve la SPA, hace proxy de `/api`, aplica CSP y cabeceras | `internal` + `edge`; **publicado solo en `127.0.0.1`** |
| `api` | ASP.NET Core .NET 10 alpine (`docker/api.Dockerfile`) | API REST y SQLite | solo `internal` (red sin salida al exterior); **sin puertos publicados** |
| volumen `stickyboard-data` | — | `/data/stickyboard.db` (SQLite) | — |

## Puesta en marcha

```bash
docker compose up -d --build      # construye y arranca
docker compose ps                 # ambos servicios deben estar "healthy"
```

La web queda en `http://127.0.0.1:8080`. Si el 8080 está ocupado, copia `.env.example` a `.env` y cambia `STICKYBOARD_PORT` (el `.env` está ignorado por git). La API permite escrituras desde el navegador solo para los orígenes `http://127.0.0.1:<puerto>` y `http://localhost:<puerto>`.

Operación habitual:

```bash
docker compose logs -f            # logs (no contienen contenido de tareas)
docker compose down               # para y elimina contenedores; los datos se conservan
docker compose up -d              # vuelve a arrancar con los mismos datos
```

## Endurecimiento aplicado

- Imágenes base fijadas por digest; la de Nginx recibe `apk upgrade` en el build.
- Contenedores sin root (`app` y `nginx`), sistema de ficheros de solo lectura, `cap_drop: ALL` y `no-new-privileges`.
- La API se ejecuta con `umask 077` y `/data` con modo `700`: la base de datos es `600` (solo para nuevos volúmenes).
- Nginx descarta cualquier `Host` distinto de `localhost`/`127.0.0.1` (respuesta vacía), limita el body a 16 KB y envía CSP restrictiva (`script-src 'self'`; el script del tema es un fichero externo), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, COOP/CORP y `Permissions-Policy`.
- La API valida `Host` (`AllowedHosts`) y rechaza con `403` las peticiones que modifican datos con un `Origin` no incluido en `Security:AllowedOrigins`. No es autenticación.

## Persistencia

Los datos viven en el volumen `stickyboard-data` y sobreviven a `docker compose down` y a la recreación de contenedores. **No uses `docker compose down -v`**: borra el volumen y todos los datos.

## Backup y restauración

Se detiene la API para obtener un único fichero consistente (SQLite en modo WAL).

```bash
# Backup → ./backups/stickyboard-AAAAMMDD.tgz  (backups/ está en .gitignore; protege la carpeta con permisos del usuario)
mkdir -p backups
docker compose stop api
docker run --rm -v stickyboard_stickyboard-data:/data:ro -v "$PWD/backups:/backup" alpine:3.22 \
  tar czf /backup/stickyboard-$(date +%Y%m%d).tgz -C /data .
docker compose start api

# Restauración (SUSTITUYE los datos actuales)
docker compose stop api
docker run --rm -v stickyboard_stickyboard-data:/data -v "$PWD/backups:/backup:ro" alpine:3.22 \
  sh -c 'rm -rf /data/* && tar xzf /backup/stickyboard-AAAAMMDD.tgz -C /data && chown -R 1654:1654 /data && chmod 700 /data'
docker compose start api
```

(En PowerShell usa `${PWD}` en lugar de `$PWD`. El nombre del volumen es `<proyecto>_stickyboard-data`; el proyecto por defecto es `stickyboard`.)

El backup y la restauración se probaron: la copia contiene `stickyboard.db` y se restaura en un volumen nuevo.

## Borrado deliberado de datos

```bash
docker compose down -v            # DESTRUCTIVO: elimina el volumen. Haz antes un backup.
```

## Actualizar imágenes base y dependencias

Los digests están en `docker/*.Dockerfile`. Para refrescarlos:

```bash
docker pull mcr.microsoft.com/dotnet/sdk:10.0 mcr.microsoft.com/dotnet/aspnet:10.0-alpine \
  nginxinc/nginx-unprivileged:stable-alpine node:24-alpine
docker image inspect <imagen> --format '{{index .RepoDigests 0}}'   # copiar el digest al Dockerfile
```

Las versiones de NuGet (`*.csproj`) y npm (`frontend/package.json` + `package-lock.json`) están fijadas. Comprobaciones antes de cada entrega:

```bash
npm audit --prefix frontend
dotnet list package --vulnerable --include-transitive
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL --ignore-unfixed stickyboard-api:local
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL --ignore-unfixed stickyboard-web:local
```

## Restricción de exposición

No cambiar el binding a `0.0.0.0`, no publicar la API, no configurar reverse proxy externo y no usar Cloudflare Tunnel en el MVP. Cualquier exposición futura requiere completar el gate de `SECURITY.md` y una revisión explícita antes del cambio.
