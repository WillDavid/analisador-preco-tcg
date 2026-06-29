<template>
  <div class="layout">
    <aside class="sidebar">
      <router-link to="/" class="sidebar-brand">
        <DollarSignIcon :size="22" />
        <span>TCG Tracker</span>
      </router-link>

      <nav>
        <router-link to="/">
          <LayoutDashboardIcon :size="18" />
          Dashboard
        </router-link>
        <router-link to="/importar">
          <UploadIcon :size="18" />
          Importar PDF
        </router-link>
        <router-link to="/colecao">
          <PackageIcon :size="18" />
          Minha Coleção
        </router-link>
        <router-link to="/historico">
          <HistoryIcon :size="18" />
          Histórico
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="text-xs">{{ importsCount }} importações</div>
        <div class="text-xs">{{ cardsCount }} cartas</div>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { DollarSignIcon, LayoutDashboardIcon, UploadIcon, PackageIcon, HistoryIcon } from 'lucide-vue-next'
import { getImports, getLatestPriceHistory } from '@/services/storageService.js'

export default {
  name: 'App',
  components: { DollarSignIcon, LayoutDashboardIcon, UploadIcon, PackageIcon, HistoryIcon },
  data() {
    return {
      importsCount: 0,
      cardsCount: 0
    }
  },
  methods: {
    refreshStats() {
      this.importsCount = getImports().length
      this.cardsCount = getLatestPriceHistory().length
    }
  },
  watch: {
    $route() {
      this.refreshStats()
    }
  },
  mounted() {
    this.refreshStats()
  }
}
</script>
