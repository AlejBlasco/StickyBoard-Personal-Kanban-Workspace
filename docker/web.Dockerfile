# Build context: repository root.
FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# Unprivileged Nginx: runs as a non-root user and listens on 8080
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime
# The pinned base can lag behind Alpine security fixes: apply them, then drop privileges again
USER root
RUN apk upgrade --no-cache
USER 101
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
