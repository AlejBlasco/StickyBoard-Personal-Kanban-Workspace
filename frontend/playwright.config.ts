import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const API_PORT = 5099
const WEB_PORT = 5174
// E2E_BASE_URL runs the suite against an already running stack (e.g. docker compose) instead of dev servers.
const externalBaseUrl = process.env.E2E_BASE_URL
const dbFile = path.resolve(import.meta.dirname, 'e2e/.tmp/e2e.db')

// Fresh database per run. The config is re-evaluated in workers, so only do it in the main process.
if (!process.env.TEST_WORKER_INDEX && !externalBaseUrl) {
  fs.rmSync(path.dirname(dbFile), { recursive: true, force: true })
  fs.mkdirSync(path.dirname(dbFile), { recursive: true })
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: externalBaseUrl ?? `http://127.0.0.1:${WEB_PORT}`,
    trace: 'retain-on-failure',
    locale: 'es-ES',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } },
      grepInvert: /@mobile/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' }, grep: /@mobile/ },
  ],
  webServer: externalBaseUrl
    ? undefined
    : [
        {
          // Real API with a throwaway SQLite file (recreated by global-setup on every run)
          command: `dotnet run --project ../src/StickyBoard.Api --no-launch-profile --urls http://127.0.0.1:${API_PORT}`,
          url: `http://127.0.0.1:${API_PORT}/api/v1/health`,
          env: {
            ConnectionStrings__Default: `Data Source=${dbFile}`,
            ASPNETCORE_ENVIRONMENT: 'Production',
            Security__AllowedOrigins__0: `http://127.0.0.1:${WEB_PORT}`,
          },
          reuseExistingServer: false,
          timeout: 120_000,
        },
        {
          command: `npx vite --port ${WEB_PORT} --strictPort`,
          url: `http://127.0.0.1:${WEB_PORT}`,
          env: { VITE_API_PROXY: `http://127.0.0.1:${API_PORT}` },
          reuseExistingServer: false,
          timeout: 60_000,
        },
      ],
})
