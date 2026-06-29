<template>
  <div>
    <div class="page-header">
      <h1>Dashboard</h1>
      <p v-if="lastUpdate">Última atualização: {{ formatDate(lastUpdate) }}</p>
    </div>

    <div v-if="hasMultiple" class="summary-grid mb-6">
      <SummaryCard label="Valor da Coleção" :value="currentTotal" isCurrency />
      <SummaryCard label="Cartas" :value="totalCards" />
      <SummaryCard label="Unidades" :value="totalUnits" />
      <SummaryCard
        label="Variação"
        :isCurrency="true"
        :value="variation"
        :subtext="variationPercentText"
        :subtextColor="variation >= 0 ? 'text-green' : 'text-red'"
      />
    </div>

    <div v-if="imports.length === 0" class="empty-state">
      <div class="icon"><FileDownIcon :size="48" /></div>
      <h3>Nenhuma coleção importada</h3>
      <p>Importe seu primeiro PDF para começar a acompanhar a evolução dos preços.</p>
      <router-link to="/importar" class="btn-primary">Importar primeiro PDF</router-link>
    </div>

    <div v-else-if="imports.length === 1" class="empty-state">
      <div class="icon"><FileDownIcon :size="48" /></div>
      <h3>Apenas uma importação</h3>
      <p>Importe um novo PDF em outra data para começar a comparar os preços.</p>
      <router-link to="/importar" class="btn-primary">Importar novo PDF</router-link>
    </div>

    <template v-else>
      <div class="flex gap-8 mb-6">
        <div class="card" style="flex:1">
          <h3 class="mb-4 font-bold">Top 5 — Maiores Altas</h3>
          <table class="ranking-table" v-if="topGainers.length">
            <thead>
              <tr>
                <th>Carta</th>
                <th>Edição</th>
                <th>Nº</th>
                <th>Anterior</th>
                <th>Atual</th>
                <th>Variação</th>
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
          <p v-else class="text-gray text-sm">Nenhuma carta com valorização nesta comparação.</p>
        </div>

        <div class="card" style="flex:1">
          <h3 class="mb-4 font-bold">Top 5 — Maiores Quedas</h3>
          <table class="ranking-table" v-if="topLosers.length">
            <thead>
              <tr>
                <th>Carta</th>
                <th>Edição</th>
                <th>Nº</th>
                <th>Anterior</th>
                <th>Atual</th>
                <th>Variação</th>
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
          <p v-else class="text-gray text-sm">Nenhuma carta com queda nesta comparação.</p>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="mb-4 font-bold">Evolução da Coleção</h3>
        <CollectionChart :labels="chartLabels" :data="chartData" label="Valor Total (Compra Menor)" />
      </div>

      <div class="card" v-if="newCards.length || removedCards.length">
        <h3 class="mb-4 font-bold">Alterações na Coleção</h3>
        <div v-if="newCards.length" class="mb-3">
          <p class="font-bold text-sm mb-2 text-green">Novas cartas ({{ newCards.length }})</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="card in newCards" :key="card.uniqueKey" class="badge badge-green">
              {{ card.name || card.uniqueKey }}
            </span>
          </div>
        </div>
        <div v-if="removedCards.length">
          <p class="font-bold text-sm mb-2 text-red">Cartas removidas ({{ removedCards.length }})</p>
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
import SummaryCard from '@/components/SummaryCard.vue'
import PriceVariation from '@/components/PriceVariation.vue'
import CollectionChart from '@/components/CollectionChart.vue'
import CardDetailModal from '@/components/CardDetailModal.vue'

export default {
  name: 'DashboardView',
  components: { SummaryCard, PriceVariation, CollectionChart, CardDetailModal, FileDownIcon },
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
