import { readFileSync } from 'node:fs'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Security headers of the production nginx config, re-used by `vite preview`
 * so local Playwright runs enforce the same CSP as production.
 */
function productionHeaders(): Record<string, string> {
  const conf = readFileSync(new URL('./nginx/security-headers.conf', import.meta.url), 'utf8')
  const headers: Record<string, string> = {}
  for (const [, name, value] of conf.matchAll(/^add_header\s+(\S+)\s+"([^"]*)"/gm)) {
    headers[name] = value
  }
  return headers
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    headers: productionHeaders(),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs live in e2e/ and run against a real browser, not jsdom
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/types/**', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html', 'json-summary'],
      // CI fails if coverage drops below these floors (raise them as tests grow)
      // (measured at v1.3.0: 90% statements, 82% branches, 88% functions, 93% lines)
      thresholds: {
        statements: 86,
        branches: 78,
        functions: 84,
        lines: 88,
      },
    },
  },
})
