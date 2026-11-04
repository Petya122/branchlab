import { expect, test, type Page } from '@playwright/test'

/**
 * Browser-level tests: real rendering, real CSS/fonts, and (when run against
 * the production image) the real nginx security headers and CSP.
 */

/** Collects console errors, uncaught exceptions and CSP violations. */
function watchForErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

async function skipTour(page: Page) {
  await page.addInitScript(() => localStorage.setItem('branchlab_tutorial_seen', 'true'))
}

async function openLab(page: Page) {
  await skipTour(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Interactive Lab', exact: true }).click()
  await expect(page.getByText('Git Branching Visualizer')).toBeVisible()
}

async function runCommand(page: Page, cmd: string) {
  const input = page.getByPlaceholder(/git commit -m/)
  await input.fill(cmd)
  await input.press('Enter')
}

const terminal = (page: Page) => page.locator('.terminal-body')

test.describe('Homepage', () => {
  test('loads without console errors or CSP violations', async ({ page }) => {
    const errors = watchForErrors(page)
    await skipTour(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/BranchLab/)
    await expect(page.getByRole('button', { name: /launch interactive lab/i })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })

  test('loads every resource from its own origin (no Google Fonts, no trackers)', async ({ page, baseURL }) => {
    const external: string[] = []
    page.on('request', (req) => {
      const url = new URL(req.url())
      if (url.protocol.startsWith('http') && url.origin !== new URL(baseURL!).origin) {
        external.push(req.url())
      }
    })
    await skipTour(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(external).toEqual([])
  })

  test('uses the self-hosted Inter font', async ({ page }) => {
    await skipTour(page)
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
    )
    expect(loaded).toContain('Inter Variable')
  })

  test('shows the onboarding tour on the first visit and closes it', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/step 1 of/i)).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).first().click()
    await expect(page.getByText(/step 1 of/i)).toBeHidden()
  })

  test('opens the lab from the hero button', async ({ page }) => {
    await skipTour(page)
    await page.goto('/')
    await page.getByRole('button', { name: /launch interactive lab/i }).first().click()
    await expect(page.getByText('Git Branching Visualizer')).toBeVisible()
  })
})

test.describe('Interactive Lab', () => {
  test('creates a branch and a commit from the terminal', async ({ page }) => {
    await openLab(page)
    await runCommand(page, 'git checkout -b feature/playwright')
    await expect(page.getByText(/commits • active:/)).toContainText('active: feature/playwright')

    await runCommand(page, 'git commit -m "test: e2e commit"')
    await expect(terminal(page)).toContainText('test: e2e commit')
  })

  test('runs the CI/CD pipeline to success', async ({ page }) => {
    await openLab(page)
    await runCommand(page, 'run pipeline')
    await expect(terminal(page)).toContainText('All checks passed', { timeout: 15_000 })
  })

  test('chaos injection makes the pipeline fail', async ({ page }) => {
    await openLab(page)
    await page.getByRole('button', { name: /tests pass/i }).click()
    await runCommand(page, 'run pipeline')
    await expect(terminal(page)).toContainText('Pipeline terminated with errors', { timeout: 15_000 })
  })

  test('switching to Trunk-Based unlocks a trophy', async ({ page }) => {
    await openLab(page)
    await page.getByRole('button', { name: /trunk-based/i }).click()
    await expect(terminal(page)).toContainText('ACHIEVEMENT UNLOCKED')
    await expect(page.getByTitle('Open DevOps Trophy Room')).toContainText(/• [1-9][0-9]* XP/)
  })

  test('quick actions are reachable on this screen size', async ({ page, isMobile }) => {
    await openLab(page)
    const actions = isMobile ? page.locator('.mobile-action-bar') : page.locator('.desktop-actions')
    await expect(actions).toBeVisible()
    await actions.getByRole('button', { name: /commit/i }).click()
    await expect(page.getByText('Create New Commit')).toBeVisible()
  })
})

test.describe('Production server', () => {
  // Only meaningful against the real nginx image (vite preview sends no such headers)
  test.skip(!process.env.E2E_EXPECT_HEADERS, 'set E2E_EXPECT_HEADERS=1 when testing the Docker image')

  test('sends the security headers', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
    const h = res.headers()
    expect(h['content-security-policy']).toContain("default-src 'self'")
    expect(h['x-frame-options']).toBe('SAMEORIGIN')
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['server'] ?? '').not.toMatch(/\d/) // no version number
  })

  test('serves build metadata at /version.json', async ({ request }) => {
    const res = await request.get('/version.json')
    expect(res.status()).toBe(200)
    expect(res.headers()['cache-control']).toBe('no-store')
    const body = await res.json()
    expect(body).toHaveProperty('version')
    expect(body).toHaveProperty('commit')
  })

  test('falls back to index.html for client-side routes', async ({ request }) => {
    const res = await request.get('/some/deep/link')
    expect(res.status()).toBe(200)
    expect(await res.text()).toContain('<div id="root">')
  })
})
