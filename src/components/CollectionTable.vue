<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th @click="$emit('sort', 'name')" style="cursor:pointer">Nome ↕</th>
          <th @click="$emit('sort', 'edition')" style="cursor:pointer">Edição ↕</th>
          <th>Número</th>
          <th>Qtd</th>
          <th>Extra</th>
          <th @click="$emit('sort', 'previousPrice')" style="cursor:pointer">Preço Anterior ↕</th>
          <th @click="$emit('sort', 'currentPrice')" style="cursor:pointer">Preço Atual ↕</th>
          <th @click="$emit('sort', 'variationValue')" style="cursor:pointer">Dif. (R$) ↕</th>
          <th @click="$emit('sort', 'variationPercent')" style="cursor:pointer">Dif. (%) ↕</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td colspan="9" class="text-center text-gray py-4">Nenhuma carta encontrada</td>
        </tr>
        <tr v-for="row in rows" :key="row.uniqueKey || row.name" @click="$emit('card-click', row)" style="cursor:pointer">
          <td class="font-bold">{{ row.name }}</td>
          <td>{{ row.edition }}</td>
          <td>{{ row.number }}</td>
          <td class="text-center">{{ row.quantity }}</td>
          <td>{{ row.extra || 'Normal' }}</td>
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
import PriceVariation from './PriceVariation.vue'

export default {
  name: 'CollectionTable',
  components: { PriceVariation },
  props: {
    rows: { type: Array, default: () => [] }
  },
  emits: ['sort'],
  methods: {
    formatCurrency(v) { return formatBrazilianCurrency(v) }
  }
}
</script>
