<template>
  <div class="summary-card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ formattedValue }}</div>
    <div v-if="subtext" class="text-xs mt-2" :class="subtextColor">{{ subtext }}</div>
  </div>
</template>

<script>
import { formatBrazilianCurrency } from '@/utils/currency.js'

export default {
  name: 'SummaryCard',
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: null },
    subtext: { type: String, default: '' },
    subtextColor: { type: String, default: 'text-gray' },
    isCurrency: { type: Boolean, default: false }
  },
  computed: {
    formattedValue() {
      if (this.value === null || this.value === undefined) return '—'
      if (this.isCurrency) return formatBrazilianCurrency(this.value)
      return Number(this.value).toLocaleString('pt-BR')
    }
  }
}
</script>
