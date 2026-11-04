import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
      // (measured at v1.2.0: 82.5% statements, 74% branches, 72% functions, 83% lines)
      thresholds: {
        statements: 78,
        branches: 70,
        functions: 65,
        lines: 78,
      },
    },
  },
})
