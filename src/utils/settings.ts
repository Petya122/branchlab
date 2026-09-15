export interface SettingsState {
  animationSpeed: 'fast' | 'normal' | 'relaxed'
  strictBranchProtection: boolean
  defaultModel: 'gitflow' | 'trunk-based' | 'github-flow'
}

export const DEFAULT_SETTINGS: SettingsState = {
  animationSpeed: 'normal',
  strictBranchProtection: true,
  defaultModel: 'gitflow',
}

const SETTINGS_KEY = 'branchlab_settings_v1'

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        animationSpeed: parsed.animationSpeed || 'normal',
        strictBranchProtection: parsed.strictBranchProtection ?? true,
        defaultModel: parsed.defaultModel || 'gitflow',
      }
    }
  } catch {
    // Fallback if blocked
  }
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Ignore quota errors
  }
}
