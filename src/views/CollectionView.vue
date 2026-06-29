<template>
  <div>
    <div class="page-header">
      <h1>Minha Coleção</h1>
      <p>{{ filteredRows.length }} cartas exibidas</p>
    </div>

    <div class="card mb-6">
      <div class="filters">
        <div class="field">
          <label>Buscar</label>
          <input v-model="search" type="text" placeholder="Nome da carta..." />
        </div>
        <div class="field">
          <label>Edição</label>
          <select v-model="filterEdition">
            <option value="">Todas</option>
            <option v-for="ed in editions" :key="ed" :value="ed">{{ ed }}</option>
          </select>
        </div>
        <div class="field">
          <label>Ordenar</label>
          <select v-model="sortField">
            <option value="name">Nome</option>
            <option value="currentPrice">Preço Atual</option>
            <option value="previousPrice">Preço Anterior</option>
            <option value="variationPercent">Maior Variação (%)</option>
            <option value="variationValue">Maior Variação (R$)</option>
            <option value="referenceDate">Últimas Variações</option>
          </select>
        </div>
        <div class="field">
          <label>Ordem</label>
          <select v-model="sortDir">
            <option value="desc">Decrescente</option>
            <option value="asc">Crescente</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="rows.length === 0" class="empty-state">
      <div class="icon"><PackageIcon :size="48" /></div>
      <h3>Nenhuma carta na coleção</h3>
      <p>Importe um PDF para começar a acompanhar sua coleção.</p>
      <router-link to="/importar" class="btn-primary">Importar PDF</router-link>
    </div>

    <div v-else class="card">
      <CollectionTable :rows="paginatedRows" @sort="handleSort" @card-click="openDetail" />
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page <= 1" @click="page--">Anterior</button>
        <span class="text-sm text-gray">{{ page }} de {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="page++">Próximo</button>
      </div>
    </div>

    <CardDetailModal
      :visible="showDetail"
      :card="selectedCard"
      @close="showDetail = false"
    />
  </div>
</template>

<script>
import { PackageIcon } from 'lucide-vue-next'
import { getImports, getPriceHistoryByImportId } from '@/services/storageService.js'
import { computeComparison } from '@/services/calculationService.js'
import CollectionTable from '@/components/CollectionTable.vue'
import CardDetailModal from '@/components/CardDetailModal.vue'

export default {
  name: 'CollectionView',
  components: { CollectionTable, CardDetailModal, PackageIcon },
  data() {
    return {
      rows: [],
      search: '',
      filterEdition: '',
      sortField: 'variationPercent',
      sortDir: 'desc',
      page: 1,
      pageSize: 100,
      showDetail: false,
      selectedCard: {}
    }
  },
  computed: {
    editions() {
      const set = new Set(this.rows.map(r => r.edition).filter(Boolean))
      return [...set].sort()
    },
    filteredRows() {
      let result = [...this.rows]

      if (this.search) {
        const q = this.search.toLowerCase()
        result = result.filter(r => (r.name || '').toLowerCase().includes(q))
      }
      if (this.filterEdition) {
        result = result.filter(r => r.edition === this.filterEdition)
      }

      const dir = this.sortDir === 'asc' ? 1 : -1
      result.sort((a, b) => {
        let va = a[this.sortField]
        let vb = b[this.sortField]
        if (typeof va === 'string') va = va.toLowerCase()
        if (typeof vb === 'string') vb = vb.toLowerCase()
        if (va == null) va = 0
        if (vb == null) vb = 0
        if (va < vb) return -1 * dir
        if (va > vb) return 1 * dir
        return 0
      })

      return result
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize))
    },
    paginatedRows() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredRows.slice(start, start + this.pageSize)
    }
  },
  methods: {
    handleSort(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortDir = 'desc'
      }
      this.page = 1
    },
    openDetail(card) {
      this.selectedCard = card
      this.showDetail = true
    },
    loadData() {
      const imports = getImports().sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
      if (imports.length === 0) return

      const latest = imports[imports.length - 1]
      const currentHistory = getPriceHistoryByImportId(latest.id)
      let previousHistory = []
      if (imports.length > 1) {
        previousHistory = getPriceHistoryByImportId(imports[imports.length - 2].id)
      }

      if (previousHistory.length > 0) {
        this.rows = computeComparison(currentHistory, previousHistory, 'buyMin')
          .filter(c => !c.isRemoved)
      } else {
        this.rows = currentHistory.map(h => ({
          ...h,
          previousPrice: null,
          currentPrice: h.prices.buyMin ?? null,
          variationValue: 0,
          variationPercent: 0,
          isNew: false,
          isRemoved: false
        }))
      }
    }
  },
  mounted() {
    this.loadData()
  }
}
</script>
