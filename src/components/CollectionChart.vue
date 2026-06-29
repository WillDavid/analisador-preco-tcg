<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default {
  name: 'CollectionChart',
  props: {
    labels: { type: Array, default: () => [] },
    data: { type: Array, default: () => [] },
    label: { type: String, default: 'Valor' }
  },
  data() {
    return { chart: null }
  },
  mounted() {
    this.createChart()
  },
  beforeUnmount() {
    if (this.chart) this.chart.destroy()
  },
  watch: {
    labels() { this.updateChart() },
    data() { this.updateChart() }
  },
  methods: {
    createChart() {
      if (!this.$refs.canvas) return
      this.chart = new Chart(this.$refs.canvas, {
        type: 'line',
        data: {
          labels: this.labels,
          datasets: [{
            label: this.label,
            data: this.data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { font: { size: 11 } },
              grid: { display: false }
            },
            y: {
              ticks: {
                font: { size: 11 },
                callback: v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
              },
              grid: { color: '#f1f5f9' }
            }
          }
        }
      })
    },
    updateChart() {
      if (!this.chart) {
        this.createChart()
        return
      }
      this.chart.data.labels = this.labels
      this.chart.data.datasets[0].data = this.data
      this.chart.update()
    }
  }
}
</script>

<style scoped>
canvas { width: 100% !important; height: 300px !important; }
</style>
