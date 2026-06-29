<template>
  <span class="flex items-center gap-1" :class="colorClass">
    <ArrowUpIcon v-if="value > 0" :size="14" />
    <ArrowDownIcon v-if="value < 0" :size="14" />
    <MinusIcon v-if="value === 0" :size="14" />
    <span class="font-bold">{{ formattedValue }}</span>
    <span v-if="showPercent && percent !== null" class="text-xs">({{ formatPercent(percent) }})</span>
  </span>
</template>

<script>
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-vue-next'
import { formatBrazilianCurrency, formatPercent } from '@/utils/currency.js'

export default {
  name: 'PriceVariation',
  components: { ArrowUpIcon, ArrowDownIcon, MinusIcon },
  props: {
    value: { type: Number, default: 0 },
    percent: { type: Number, default: null },
    showPercent: { type: Boolean, default: true },
    isCurrency: { type: Boolean, default: true }
  },
  computed: {
    colorClass() {
      if (this.value > 0) return 'text-green'
      if (this.value < 0) return 'text-red'
      return 'text-gray'
    },
    formattedValue() {
      if (this.isCurrency) {
        const prefix = this.value > 0 ? '+' : ''
        return prefix + formatBrazilianCurrency(this.value)
      }
      return this.value > 0 ? `+${this.value}` : `${this.value}`
    }
  },
  methods: { formatPercent }
}
</script>
