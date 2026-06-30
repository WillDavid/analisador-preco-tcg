<template>
  <div>
    <div class="page-header">
      <h1>{{ t('dashboard.heading') }}</h1>
      <p v-if="lastUpdate">{{ t('dashboard.lastUpdate') }} {{ formatDate(lastUpdate) }}</p>
    </div>

    <div v-if="hasMultiple" class="summary-grid mb-6">
      <SummaryCard :label="t('dashboard.collectionValue')" :value="currentTotal" isCurrency />
      <SummaryCard :label="t('dashboard.cards')" :value="totalCards" />
      <SummaryCard :label="t('dashboard.units')" :value="totalUnits" />
      <SummaryCard
        :label="t('dashboard.variation')"
        :isCurrency="true"
        :value="variation"
        :subtext="variationPercentText"
        :subtextColor="variation >= 0 ? 'text-green' : 'text-red'"
      />
    </div>

    <div v-if="imports.length === 0" class="empty-state">
      <div class="icon"><FileDownIcon :size="48" /></div>
      <h3>{{ t('dashboard.emptyTitle') }}</h3>
      <p>{{ t('dashboard.emptyMsg') }}</p>
      <router-link :to="navPath('/importar', '/carga')" class="btn-primary">{{ t('dashboard.emptyBtn') }}</router-link>
    </div>

    <div v-else-if="imports.length === 1" class="empty-state">
      <div class="icon"><FileDownIcon :size="48" /></div>
      <h3>{{ t('dashboard.singleTitle') }}</h3>
      <p>{{ t('dashboard.singleMsg') }}</p>
      <router-link :to="navPath('/importar', '/carga')" class="btn-primary">{{ t('dashboard.singleBtn') }}</router-link>
    </div>

    <template v-else>
      <div class="flex gap-8 mb-6">
        <div class="card" style="flex:1">
          <h3 class="mb-4 font-bold">{{ t('dashboard.topGainers') }}</h3>
          <table class="ranking-table" v-if="topGainers.length">
            <thead>
              <tr>
                <th>{{ t('table.card') }}</th>
                <th>{{ t('table.edition') }}</th>
                <th>{{ t('table.number') }}</th>
                <th>{{ t('table.previous') }}</th>
                <th>{{ t('table.current') }}</th>
                <th>{{ t('table.variation') }}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="card in topGainers" :key="card.uniqueKey" @click="openDetail(card)" style="cursor:pointer">
                <td class="font-bold">{{ card.name }}</td>
                <td class="text-sm text-gray">{{ card.edition }}</td>
                <td class="text-sm text-gray">{{ card.number }}</td>
                <td class="text-right">{{ formatCurrency(card.previousPrice) }}</td>
                <td class="text-right">{{ formatCurrency(card.currentPrice) }}</td>
                <td class="text-right">
                  <PriceVariation :value="card.variationValue" :percent="null" :showPercent="false" />
                </td>
                <td class="text-right">
                  <PriceVariation :value="card.variationPercent" :percent="null" :showPercent="false" :isCurrency="false" />
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-gray text-sm">{{ t('data.noGainers') }}</p>
        </div>

        <div class="card" style="flex:1">
          <h3 class="mb-4 font-bold">{{ t('dashboard.topLosers') }}</h3>
          <table class="ranking-table" v-if="topLosers.length">
            <thead>
              <tr>
                <th>{{ t('table.card') }}</th>
                <th>{{ t('table.edition') }}</th>
                <th>{{ t('table.number') }}</th>
                <th>{{ t('table.previous') }}</th>
                <th>{{ t('table.current') }}</th>
                <th>{{ t('table.variation') }}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="card in topLosers" :key="card.uniqueKey" @click="openDetail(card)" style="cursor:pointer">
                <td class="font-bold">{{ card.name }}</td>
                <td class="text-sm text-gray">{{ card.edition }}</td>
                <td class="text-sm text-gray">{{ card.number }}</td>
                <td class="text-right">{{ formatCurrency(card.previousPrice) }}</td>
                <td class="text-right">{{ formatCurrency(card.currentPrice) }}</td>
                <td class="text-right">
                  <PriceVariation :value="card.variationValue" :percent="null" :showPercent="false" />
                </td>
                <td class="text-right">
                  <PriceVariation :value="card.variationPercent" :percent="null" :showPercent="false" :isCurrency="false" />
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="text-gray text-sm">{{ t('data.noLosers') }}</p>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="mb-4 font-bold">{{ t('dashboard.evolution') }}</h3>
        <CollectionChart :labels="chartLabels" :data="chartData" :label="t('dashboard.chartLabel')" />
      </div>

      <div class="card" v-if="newCards.length || removedCards.length">
        <h3 class="mb-4 font-bold">{{ t('dashboard.changes') }}</h3>
        <div v-if="newCards.length" class="mb-3">
          <p class="font-bold text-sm mb-2 text-green">{{ t('dashboard.newCards') }} ({{ newCards.length }})</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="card in newCards" :key="card.uniqueKey" class="badge badge-green">
              {{ card.name || card.uniqueKey }}
            </span>
          </div>
        </div>
        <div v-if="removedCards.length">
          <p class="font-bold text-sm mb-2 text-red">{{ t('dashboard.removedCards') }} ({{ removedCards.length }})</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="card in removedCards" :key="card.uniqueKey" class="badge badge-red">
              {{ card.name || card.uniqueKey }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <CardDetailModal
      :visible="showDetail"
      :card="selectedCard"
      @close="showDetail = false"
    />
  </div>
</template>

<script>
import { FileDownIcon } from 'lucide-vue-next'
import { getImports, getPriceHistoryByImportId } from '@/services/storageService.js'
import { getCollectionTotal, getTotalCards, getTotalUnits, computeComparison, getTopGainers, getTopLosers } from '@/services/calculationService.js'
import { formatBrazilianCurrency } from '@/utils/currency.js'
import { formatDate } from '@/utils/dates.js'
import { useLabels } from '@/composables/useLabels.js'
import SummaryCard from '@/components/SummaryCard.vue'
import PriceVariation from '@/components/PriceVariation.vue'
import CollectionChart from '@/components/CollectionChart.vue'
import CardDetailModal from '@/components/CardDetailModal.vue'

export default {
  name: 'DashboardView',
  components: { SummaryCard, PriceVariation, CollectionChart, CardDetailModal, FileDownIcon },
  setup() {
    const { t, mode } = useLabels()
    return { t, mode }
  },
  data() {
    return {
      imports: [],
      currentHistory: [],
      previousHistory: [],
      comparison: [],
      showDetail: false,
      selectedCard: {}
    }
  },
  computed: {
    currentTotal() {
      return getCollectionTotal(this.currentHistory, 'buyMin')
    },
    previousTotal() {
      return getCollectionTotal(this.previousHistory, 'buyMin')
    },
    totalCards() {
      return getTotalCards(this.currentHistory)
    },
    totalUnits() {
      return getTotalUnits(this.currentHistory)
    },
    variation() {
      return this.currentTotal - this.previousTotal
    },
    variationPercentText() {
      if (this.previousTotal > 0) {
        const pct = ((this.currentTotal - this.previousTotal) / this.previousTotal) * 100
        return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
      }
      return ''
    },
    hasMultiple() {
      return this.imports.length >= 2
    },
    lastUpdate() {
      return this.imports.length > 0
        ? this.imports[this.imports.length - 1].referenceDate
        : null
    },
    topGainers() {
      return getTopGainers(this.comparison, 5)
    },
    topLosers() {
      return getTopLosers(this.comparison, 5)
    },
    newCards() {
      return this.comparison.filter(c => c.isNew)
    },
    removedCards() {
      return this.comparison.filter(c => c.isRemoved)
    },
    chartLabels() {
      return this.imports.map(i => formatDate(i.referenceDate))
    },
    chartData() {
      return this.imports.map(imp => {
        const hist = getPriceHistoryByImportId(imp.id)
        return getCollectionTotal(hist, 'buyMin')
      })
    }
  },
  methods: {
    navPath(base, stealth) {
      return this.mode === 'stealth' ? stealth : base
    },
    formatCurrency(val) { return formatBrazilianCurrency(val) },
    formatDate(val) { return formatDate(val) },
    loadData() {
      this.imports = getImports().sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
      if (this.imports.length > 0) {
        const latest = this.imports[this.imports.length - 1]
        this.currentHistory = getPriceHistoryByImportId(latest.id)
      }
      if (this.imports.length > 1) {
        const prev = this.imports[this.imports.length - 2]
        this.previousHistory = getPriceHistoryByImportId(prev.id)
      }
      if (this.currentHistory.length && this.previousHistory.length) {
        this.comparison = computeComparison(this.currentHistory, this.previousHistory, 'buyMin')
      }
    },
    openDetail(card) {
      this.selectedCard = card
      this.showDetail = true
    }
  },
  mounted() {
    this.loadData()
  }
}
</script>
