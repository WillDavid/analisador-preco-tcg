<template>
  <div>
    <div class="page-header">
      <h1>{{ t('history.heading') }}</h1>
      <p>{{ imports.length }} {{ t('history.subheading') }}</p>
    </div>

    <div v-if="imports.length === 0" class="empty-state">
      <div class="icon"><CalendarIcon :size="48" /></div>
      <h3>{{ t('history.emptyTitle') }}</h3>
      <p>{{ t('history.emptyMsg') }}</p>
      <router-link :to="navPath('/config', '/config')" class="btn-primary">{{ t('history.emptyBtn') }}</router-link>
    </div>

    <div v-else class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{{ t('table.import.date') }}</th>
              <th>{{ t('table.import.file') }}</th>
              <th>{{ t('table.import.cards') }}</th>
              <th>{{ t('table.import.total') }}</th>
              <th>{{ t('table.import.variation') }}</th>
              <th>{{ t('table.import.imported') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(imp, idx) in sortedImports" :key="imp.id">
              <td class="font-bold">{{ formatDate(imp.referenceDate) }}</td>
              <td class="text-sm text-gray">{{ imp.filename }}</td>
              <td class="text-center">{{ getHistoryCount(imp.id) }}</td>
              <td class="text-right font-bold">{{ formatCurrency(getTotal(imp.id)) }}</td>
              <td class="text-right">
                <PriceVariation
                  v-if="idx < sortedImports.length - 1"
                  :value="getVariation(imp.id, sortedImports[idx + 1]?.id)"
                  :percent="null"
                  :showPercent="false"
                />
                <span v-else class="text-gray">{{ t('history.noVariation') }}</span>
              </td>
              <td class="text-sm text-gray">{{ formatDateTime(imp.importedAt) }}</td>
              <td>
                <button class="btn-sm btn-danger" @click="confirmDelete(imp)">{{ t('history.deleteBtn') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal
      :visible="showDeleteModal"
      :title="t('history.deleteTitle')"
      :message="`${t('history.deleteMsg')} ${deleteTarget ? formatDate(deleteTarget.referenceDate) : ''}${t('history.deleteMsgSuffix')}`"
      :confirmLabel="t('history.deleteConfirm')"
      :danger="true"
      @confirm="doDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script>
import { CalendarIcon } from 'lucide-vue-next'
import { getImports, deleteImport, getPriceHistoryByImportId } from '@/services/storageService.js'
import { getCollectionTotal } from '@/services/calculationService.js'
import { formatBrazilianCurrency } from '@/utils/currency.js'
import { formatDate, formatDateTime } from '@/utils/dates.js'
import { useLabels } from '@/composables/useLabels.js'
import PriceVariation from '@/components/PriceVariation.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

export default {
  name: 'HistoryView',
  components: { PriceVariation, ConfirmModal, CalendarIcon },
  setup() {
    const { t, mode } = useLabels()
    return { t, mode }
  },
  data() {
    return {
      imports: [],
      totalsCache: {},
      countCache: {},
      showDeleteModal: false,
      deleteTarget: null
    }
  },
  computed: {
    sortedImports() {
      return [...this.imports].sort((a, b) => b.referenceDate.localeCompare(a.referenceDate))
    }
  },
  methods: {
    navPath(base, stealth) {
      return this.mode === 'stealth' ? stealth : base
    },
    formatCurrency(v) { return formatBrazilianCurrency(v) },
    formatDate(v) { return formatDate(v) },
    formatDateTime(v) { return formatDateTime(v) },
    getTotal(id) {
      return this.totalsCache[id] || 0
    },
    getHistoryCount(id) {
      return this.countCache[id] || 0
    },
    getVariation(currentId, prevId) {
      const curr = this.totalsCache[currentId] || 0
      const prev = this.totalsCache[prevId] || 0
      return curr - prev
    },
    confirmDelete(imp) {
      this.deleteTarget = imp
      this.showDeleteModal = true
    },
    async doDelete() {
      if (this.deleteTarget) {
        await deleteImport(this.deleteTarget.id)
        await this.loadData()
      }
      this.showDeleteModal = false
      this.deleteTarget = null
    },
    async loadData() {
      this.imports = await getImports()
      this.totalsCache = {}
      this.countCache = {}
      for (const imp of this.imports) {
        const hist = await getPriceHistoryByImportId(imp.id)
        this.totalsCache[imp.id] = getCollectionTotal(hist, 'buyMin')
        this.countCache[imp.id] = hist.length
      }
    }
  },
  async mounted() {
    await this.loadData()
  }
}
</script>
