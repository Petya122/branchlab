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

/**
 * Records every Content-Security-Policy violation the browser reports
 * (blocked inline styles, scripts, fonts, images...) into window.__cspViolations.
 */
async function recordCspViolations(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: string[] }
    w.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__cspViolations.push(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'} (${e.sourceFile}:${e.lineNumber})`)
    })
  })
}

const cspViolations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)

/**
 * WHY E2E: only a real browser shows real layout, real fonts, real CSP
 * enforcement and the real nginx headers. Logic is tested much faster in
 * Vitest, so these tests cover what jsdom cannot: the page works end to end
 * for a visitor, on desktop and on a phone.
 */

test.describe('Homepage', () => {
  test('loads without console errors', async ({ page }) => {
    const errors = watchForErrors(page)
    await skipTour(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/BranchLab/)
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })

  // Privacy (GDPR): no Google Fonts, CDNs or trackers; the font must still load
  test('loads everything from its own origin, including the self-hosted font', async ({ page, baseURL }) => {
    const external: string[] = []
    page.on('request', (req) => {
      const url = new URL(req.url())
      if (url.protocol.startsWith('http') && url.origin !== new URL(baseURL!).origin) external.push(req.url())
    })
    await skipTour(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))
    expect(external).toEqual([])
    expect(fonts).toContain('Inter Variable')
  })

  test('first visit shows the tour; the hero button then opens the lab', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/step 1 of/i)).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).first().click()
    await expect(page.getByText(/step 1 of/i)).toBeHidden()
    await page.getByRole('button', { name: /launch interactive lab/i }).click()
    await expect(page.getByText('Git Branching Visualizer')).toBeVisible()
  })
})

test.describe('Interactive Lab', () => {
  // The core story of the app, in a real browser: a red pipeline blocks the
  // pull request, fixing it makes the pipeline green, and the PR can merge.
  test('quality gate journey: red CI blocks the PR, green CI lets it merge', async ({ page }) => {
    await openLab(page) // GitFlow, on feature/auth
    const prButton = page.getByRole('button', { name: /^PR$/ }).last()
    const confirm = page.getByRole('button', { name: /confirm squash & merge/i })

    await page.getByRole('button', { name: /tests pass/i }).click() // inject a failing test
    await runCommand(page, 'run pipeline')
    await expect(terminal(page)).toContainText('Pipeline terminated with errors', { timeout: 15_000 })
    await prButton.click()
    await expect(confirm).toBeDisabled()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: /tests fail/i }).click() // fix it
    await runCommand(page, 'run pipeline')
    await expect(terminal(page)).toContainText('All checks passed', { timeout: 15_000 })
    await prButton.click()
    await confirm.click()
    await expect(terminal(page)).toContainText('squash-merged into develop')
    await expect(page.getByText(/commits • active:/)).toContainText('active: develop')
  })

  // Regression: at 1280px the PR / Conflict / Run CI/CD buttons were pushed
  // off-screen, and on phones the action dock only appeared at the page end.
  test('every quick action is fully on screen and works', async ({ page, isMobile }) => {
    if (!isMobile) await page.setViewportSize({ width: 1280, height: 800 })
    await openLab(page)
    const actions = isMobile ? page.locator('.mobile-action-bar') : page.locator('.desktop-actions')
    for (const button of await actions.getByRole('button').all()) {
      await expect(button).toBeInViewport({ ratio: 1 })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)
    await actions.getByRole('button', { name: /commit/i }).click()
    await expect(page.getByText('Create New Commit')).toBeVisible()
  })
})

test.describe('Content Security Policy', () => {
  // vite preview sends the same headers as nginx (see vite.config.ts), so these
  // run both locally and against the production image in CI.

  test('is strict: deny by default, no unsafe-inline or unsafe-eval', async ({ request }) => {
    const csp = (await request.get('/')).headers()['content-security-policy'] ?? ''
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).not.toContain('unsafe-inline')
    expect(csp).not.toContain('unsafe-eval')
  })

  test('nothing in the app violates it', async ({ page }) => {
    const errors = watchForErrors(page)
    await recordCspViolations(page)
    await openLab(page)

    // Exercise every view that renders inline styles, SVG, canvas or modals
    for (const title of [
      'Simulate GitHub Pull Request & Branch Protection',
      'Simulate Interactive Git Merge Conflict',
      'Open DevOps Trophy Room',
      'Open Settings',
      'Open Guided Tutorial Tour',
    ]) {
      const button = page.getByTitle(title)
      if (await button.isVisible()) {
        await button.click()
        await expect(page.locator('.modal-overlay')).toBeVisible()
        await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } })
      }
    }
    // A passing pipeline fires canvas-confetti
    await runCommand(page, 'run pipeline')
    await expect(terminal(page)).toContainText('All checks passed', { timeout: 15_000 })
    await page.getByRole('button', { name: 'Home', exact: true }).click()
    await page.waitForLoadState('networkidle')

    expect(await cspViolations(page)).toEqual([])
    expect(errors).toEqual([])
  })
})

test.describe('Production server', () => {
  // Only meaningful against the real nginx image (version.json, nginx headers)
  test.skip(!process.env.E2E_EXPECT_HEADERS, 'set E2E_EXPECT_HEADERS=1 when testing the Docker image')

  test('sends the security headers', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
    const h = res.headers()
    expect(h['content-security-policy']).toContain("default-src 'none'")
    expect(h['x-frame-options']).toBe('SAMEORIGIN')
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('no-referrer')
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
