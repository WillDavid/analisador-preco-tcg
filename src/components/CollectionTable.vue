<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th @click="$emit('sort', 'name')" style="cursor:pointer">{{ t('table.nameCol') }}</th>
          <th @click="$emit('sort', 'edition')" style="cursor:pointer">{{ t('table.editionCol') }}</th>
          <th>{{ t('table.numberFull') }}</th>
          <th>{{ t('table.qtd') }}</th>
          <th>{{ t('table.extra') }}</th>
          <th @click="$emit('sort', 'previousPrice')" style="cursor:pointer">{{ t('table.prevPrice') }}</th>
          <th @click="$emit('sort', 'currentPrice')" style="cursor:pointer">{{ t('table.currPrice') }}</th>
          <th @click="$emit('sort', 'variationValue')" style="cursor:pointer">{{ t('table.diffR') }}</th>
          <th @click="$emit('sort', 'variationPercent')" style="cursor:pointer">{{ t('table.diffPercent') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td colspan="9" class="text-center text-gray py-4">{{ t('data.noCardsFound') }}</td>
        </tr>
        <tr v-for="row in rows" :key="row.uniqueKey || row.name" @click="$emit('card-click', row)" style="cursor:pointer">
          <td class="font-bold">{{ row.name }}</td>
          <td>{{ row.edition }}</td>
          <td>{{ row.number }}</td>
          <td class="text-center">{{ row.quantity }}</td>
          <td>{{ row.extra || t('data.normal') }}</td>
          <td class="text-right">{{ formatCurrency(row.previousPrice) }}</td>
          <td class="text-right font-bold">{{ formatCurrency(row.currentPrice) }}</td>
          <td class="text-right">
            <PriceVariation :value="row.variationValue" :percent="null" :showPercent="false" />
          </td>
          <td class="text-right">
            <PriceVariation :value="row.variationPercent" :percent="null" :showPercent="false" :isCurrency="false" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { formatBrazilianCurrency } from '@/utils/currency.js'
import { useLabels } from '@/composables/useLabels.js'
import PriceVariation from './PriceVariation.vue'

export default {
  name: 'CollectionTable',
  components: { PriceVariation },
  props: {
    rows: { type: Array, default: () => [] }
  },
  emits: ['sort'],
  setup() {
    const { t } = useLabels()
    return { t }
  },
  methods: {
    formatCurrency(v) { return formatBrazilianCurrency(v) }
  }
}
</script>
