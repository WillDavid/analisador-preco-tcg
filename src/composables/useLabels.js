import { ref, watch } from 'vue'
import labels from '@/config/labels.js'

const MODE_KEY = 'stealth_mode'

const mode = ref(loadMode())

function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'stealth' ? 'stealth' : 'tcg'
  } catch {
    return 'tcg'
  }
}

function saveMode(val) {
  try {
    localStorage.setItem(MODE_KEY, val)
  } catch { /* ignore */ }
}

watch(mode, saveMode)

export function useLabels() {
  function t(key) {
    const entry = labels[key]
    if (!entry) return key
    return entry[mode.value] || entry.tcg || key
  }

  function getRoutePath(basePath, stealthPath) {
    return mode.value === 'stealth' ? stealthPath : basePath
  }

  function toggleMode() {
    mode.value = mode.value === 'tcg' ? 'stealth' : 'tcg'
  }

  return { mode, t, getRoutePath, toggleMode }
}
