<template>
  <div>
    <div class="page-header">
      <h1>{{ t('collection.heading') }}</h1>
      <p>{{ filteredRows.length }} {{ t('collection.subheading') }}</p>
    </div>

    <div class="card mb-6">
      <div class="filters">
        <div class="field">
          <label>{{ t('collection.searchLabel') }}</label>
          <input v-model="search" type="text" :placeholder="t('collection.searchPlaceholder')" />
        </div>
        <div class="field">
          <label>{{ t('collection.editionLabel') }}</label>
          <select v-model="filterEdition">
            <option value="">{{ t('collection.editionAll') }}</option>
            <option v-for="ed in editions" :key="ed" :value="ed">{{ ed }}</option>
          </select>
        </div>
        <div class="field">
          <label>{{ t('collection.sortLabel') }}</label>
          <select v-model="sortField">
            <option value="name">{{ t('collection.sortName') }}</option>
            <option value="currentPrice">{{ t('collection.sortCurrPrice') }}</option>
            <option value="previousPrice">{{ t('collection.sortPrevPrice') }}</option>
            <option value="variationPercent">{{ t('collection.sortVarPercent') }}</option>
            <option value="variationValue">{{ t('collection.sortVarValue') }}</option>
            <option value="referenceDate">{{ t('collection.sortRecent') }}</option>
          </select>
        </div>
        <div class="field">
          <label>{{ t('collection.orderLabel') }}</label>
          <select v-model="sortDir">
            <option value="desc">{{ t('collection.orderDesc') }}</option>
            <option value="asc">{{ t('collection.orderAsc') }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="rows.length === 0" class="empty-state">
      <div class="icon"><PackageIcon :size="48" /></div>
      <h3>{{ t('collection.emptyTitle') }}</h3>
      <p>{{ t('collection.emptyMsg') }}</p>
      <router-link :to="navPath('/config', '/config')" class="btn-primary">{{ t('collection.emptyBtn') }}</router-link>
    </div>

    <div v-else class="card">
      <CollectionTable :rows="paginatedRows" @sort="handleSort" @card-click="openDetail" />
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page <= 1" @click="page--">{{ t('collection.prevBtn') }}</button>
        <span class="text-sm text-gray">{{ page }} de {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="page++">{{ t('collection.nextBtn') }}</button>
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
import { useLabels } from '@/composables/useLabels.js'
import CollectionTable from '@/components/CollectionTable.vue'
import CardDetailModal from '@/components/CardDetailModal.vue'

export default {
  name: 'CollectionView',
  components: { CollectionTable, CardDetailModal, PackageIcon },
  setup() {
    const { t, mode } = useLabels()
    return { t, mode }
  },
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
    navPath(base, stealth) {
      return this.mode === 'stealth' ? stealth : base
    },
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
    async loadData() {
      const imports = (await getImports()).sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
      if (imports.length === 0) return

      const latest = imports[imports.length - 1]
      const currentHistory = await getPriceHistoryByImportId(latest.id)
      let previousHistory = []
      if (imports.length > 1) {
        previousHistory = await getPriceHistoryByImportId(imports[imports.length - 2].id)
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
  async mounted() {
    await this.loadData()
  }
}
</script>
