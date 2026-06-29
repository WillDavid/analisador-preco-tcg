<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" style="max-width:680px">
      <div class="flex justify-between items-center mb-4">
        <h3>{{ card.name || 'Carta' }}</h3>
        <button class="btn-sm" @click="$emit('close')">Fechar</button>
      </div>

      <div class="summary-grid mb-4" v-if="card.name">
        <div class="summary-card">
          <div class="label">Edição</div>
          <div class="value text-sm">{{ card.edition }}</div>
        </div>
        <div class="summary-card">
          <div class="label">Número</div>
          <div class="value text-sm">{{ card.number }}</div>
        </div>
        <div class="summary-card">
          <div class="label">Raridade</div>
          <div class="value text-sm">{{ card.rarity }}</div>
        </div>
        <div class="summary-card">
          <div class="label">Qtd / Idioma / Cond.</div>
          <div class="value text-sm">{{ card.quantity }} / {{ card.language }} / {{ card.condition }}</div>
        </div>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <div class="summary-card" style="flex:1">
          <div class="label">Preço Atual ({{ priceLabel }})</div>
          <div class="value">{{ formatCurrency(currentPrice) }}</div>
        </div>
        <div class="summary-card" style="flex:1">
          <div class="label">Menor Registrado</div>
          <div class="value">{{ formatCurrency(minPrice) }}</div>
        </div>
        <div class="summary-card" style="flex:1">
          <div class="label">Maior Registrado</div>
          <div class="value">{{ formatCurrency(maxPrice) }}</div>
        </div>
      </div>

      <div class="mb-3">
        <label class="text-xs text-gray">Preço exibido:</label>
        <select v-model="selectedField" class="mt-1" style="width:auto">
          <option value="buyMin">Compra Menor</option>
          <option value="buyAvg">Compra Média</option>
          <option value="buyMax">Compra Maior</option>
          <option value="sellMin">Venda Menor</option>
          <option value="sellAvg">Venda Média</option>
          <option value="sellMax">Venda Maior</option>
        </select>
      </div>

      <div v-if="chartLabels.length > 0" style="height:240px">
        <canvas ref="canvas"></canvas>
      </div>
      <p v-if="chartData.length <= 1" class="text-gray text-sm">Importe mais datas para visualizar a evolução.</p>

      <div class="mt-4" v-if="history.length">
        <h4 class="mb-2 font-bold">Histórico</h4>
        <table class="text-xs">
          <thead>
            <tr>
              <th>Data</th>
              <th>Qtd</th>
              <th>C-Menor</th>
              <th>C-Médio</th>
              <th>C-Maior</th>
              <th>V-Menor</th>
              <th>V-Médio</th>
              <th>V-Maior</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in history" :key="h.referenceDate + h.importId">
              <td>{{ formatDate(h.referenceDate) }}</td>
              <td class="text-center">{{ h.quantity }}</td>
              <td class="text-right">{{ formatCurrency(h.prices.buyMin) }}</td>
              <td class="text-right">{{ formatCurrency(h.prices.buyAvg) }}</td>
              <td class="text-right">{{ formatCurrency(h.prices.buyMax) }}</td>
              <td class="text-right">{{ formatCurrency(h.prices.sellMin) }}</td>
              <td class="text-right">{{ formatCurrency(h.prices.sellAvg) }}</td>
              <td class="text-right">{{ formatCurrency(h.prices.sellMax) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import { formatBrazilianCurrency } from '@/utils/currency.js'
import { formatDate } from '@/utils/dates.js'
import { getImports, getPriceHistoryByKey } from '@/services/storageService.js'

export default {
  name: 'CardDetailModal',
  props: {
    visible: { type: Boolean, default: false },
    card: { type: Object, default: () => ({}) }
  },
  emits: ['close'],
  data() {
    return {
      selectedField: 'buyMin',
      chart: null
    }
  },
  computed: {
    priceLabel() {
      const map = { buyMin:'Compra Menor', buyAvg:'Compra Média', buyMax:'Compra Maior',
        sellMin:'Venda Menor', sellAvg:'Venda Média', sellMax:'Venda Maior' }
      return map[this.selectedField] || ''
    },
    history() {
      if (!this.card.uniqueKey) return []
      const all = getPriceHistoryByKey(this.card.uniqueKey)
      const imports = getImports()
      const importMap = new Map(imports.map(i => [i.id, i.referenceDate]))
      return all
        .map(h => ({ ...h, referenceDateSort: importMap.get(h.importId) || h.referenceDate }))
        .sort((a, b) => a.referenceDateSort.localeCompare(b.referenceDateSort))
    },
    chartLabels() {
      return this.history.map(h => formatDate(h.referenceDateSort || h.referenceDate))
    },
    chartData() {
      return this.history.map(h => h.prices[this.selectedField] ?? null)
    },
    currentPrice() {
      if (this.history.length === 0) return null
      return this.history[this.history.length - 1].prices[this.selectedField]
    },
    minPrice() {
      const vals = this.history.map(h => h.prices[this.selectedField]).filter(v => v != null)
      return vals.length ? Math.min(...vals) : null
    },
    maxPrice() {
      const vals = this.history.map(h => h.prices[this.selectedField]).filter(v => v != null)
      return vals.length ? Math.max(...vals) : null
    }
  },
  methods: {
    formatCurrency(v) { return formatBrazilianCurrency(v) },
    formatDate(v) { return formatDate(v) },
    createChart() {
      if (!this.$refs.canvas || !this.visible) return
      if (this.chart) this.chart.destroy()
      this.chart = new Chart(this.$refs.canvas, {
        type: 'line',
        data: {
          labels: this.chartLabels,
          datasets: [{
            label: this.priceLabel,
            data: this.chartData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 10 } }, grid: { display: false } },
            y: {
              ticks: {
                font: { size: 10 },
                callback: v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
              }
            }
          }
        }
      })
    }
  },
  watch: {
    visible(val) {
      if (val) this.$nextTick(() => this.createChart())
      else if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    },
    selectedField() {
      if (this.visible) this.$nextTick(() => this.createChart())
    },
    history() {
      if (this.visible) this.$nextTick(() => this.createChart())
    }
  }
}
</script>
