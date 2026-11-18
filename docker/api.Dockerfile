# Build context: repository root. Base images are pinned by digest (see docs/DEPLOYMENT.md to refresh them).
FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:bef136a371963aaa46ec97882845ef6f54dec15728bb4b128b1c2a400ffbc9b4 AS build
WORKDIR /src

# Restore first so the layer is cached until a project file changes
COPY src/StickyBoard.Domain/StickyBoard.Domain.csproj src/StickyBoard.Domain/
COPY src/StickyBoard.Application/StickyBoard.Application.csproj src/StickyBoard.Application/
COPY src/StickyBoard.Infrastructure/StickyBoard.Infrastructure.csproj src/StickyBoard.Infrastructure/
COPY src/StickyBoard.Api/StickyBoard.Api.csproj src/StickyBoard.Api/
RUN dotnet restore src/StickyBoard.Api/StickyBoard.Api.csproj

COPY src/ src/
RUN dotnet publish src/StickyBoard.Api/StickyBoard.Api.csproj -c Release --no-restore -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine@sha256:21c3f9798416cba4c0576a947c286231cb71ea2884896cb968253f5c9668f930 AS runtime
WORKDIR /app

# SQLite lives in /data (a named volume). Directory is private to the non-root user.
RUN mkdir /data && chown app:app /data && chmod 700 /data

COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0 \
    ConnectionStrings__Default="Data Source=/data/stickyboard.db"

USER app
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "umask 077 && exec dotnet StickyBoard.Api.dll"]
