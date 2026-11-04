const TUTORIAL_SEEN_KEY = 'branchlab_tutorial_seen'

/** True when the onboarding tour should open automatically on startup. */
export function shouldShowTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) !== 'true'
  } catch {
    return false
  }
}

/** Forget the "don't show again" choice so the tour opens again. */
export function resetTutorialSeen(): void {
  try {
    localStorage.removeItem(TUTORIAL_SEEN_KEY)
  } catch {
    // Storage blocked: nothing to reset
  }
}
