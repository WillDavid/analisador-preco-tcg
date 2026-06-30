<template>
  <div class="layout">
    <aside class="sidebar">
      <router-link :to="navPath('/', '/painel')" class="sidebar-brand">
        <DollarSignIcon :size="22" />
        <span>{{ t('app.brand') }}</span>
      </router-link>

      <nav>
        <router-link :to="navPath('/', '/painel')">
          <LayoutDashboardIcon :size="18" />
          {{ t('nav.dashboard') }}
        </router-link>
        <router-link :to="navPath('/importar', '/carga')">
          <UploadIcon :size="18" />
          {{ t('nav.import') }}
        </router-link>
        <router-link :to="navPath('/colecao', '/base')">
          <PackageIcon :size="18" />
          {{ t('nav.collection') }}
        </router-link>
        <router-link :to="navPath('/historico', '/log')">
          <HistoryIcon :size="18" />
          {{ t('nav.history') }}
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="text-xs">{{ importsCount }} {{ t('footer.imports') }}</div>
        <div class="text-xs">{{ cardsCount }} {{ t('footer.cards') }}</div>
        <button
          class="stealth-toggle"
          :class="{ active: mode === 'stealth' }"
          @click="toggleMode"
          :title="mode === 'stealth' ? 'Modo normal' : 'Modo discricao'"
        >
          <EyeIcon :size="14" v-if="mode === 'tcg'" />
          <EyeOffIcon :size="14" v-else />
        </button>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { DollarSignIcon, LayoutDashboardIcon, UploadIcon, PackageIcon, HistoryIcon, EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { getImports, getLatestPriceHistory } from '@/services/storageService.js'
import { useLabels } from '@/composables/useLabels.js'

export default {
  name: 'App',
  components: { DollarSignIcon, LayoutDashboardIcon, UploadIcon, PackageIcon, HistoryIcon, EyeIcon, EyeOffIcon },
  setup() {
    const { t, mode, toggleMode } = useLabels()
    document.title = t('app.title')
    return { t, mode, toggleMode }
  },
  data() {
    return {
      importsCount: 0,
      cardsCount: 0
    }
  },
  methods: {
    navPath(base, stealth) {
      return this.mode === 'stealth' ? stealth : base
    },
    refreshStats() {
      this.importsCount = getImports().length
      this.cardsCount = getLatestPriceHistory().length
    },
    onKeydown(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        this.toggleMode()
      }
    }
  },
  watch: {
    $route() {
      this.refreshStats()
    },
    mode() {
      document.title = this.t('app.title')
    }
  },
  mounted() {
    this.refreshStats()
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  }
}
</script>

<style>
.stealth-toggle {
  margin-top: 0.5rem;
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.2s;
}
.stealth-toggle:hover,
.stealth-toggle.active { opacity: 1; color: var(--color-primary); }
</style>
