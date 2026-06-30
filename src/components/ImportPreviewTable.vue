<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>{{ t('table.edition') }}</th>
          <th>{{ t('table.numberFull') }}</th>
          <th>{{ t('table.name') }}</th>
          <th>{{ t('table.qtd') }}</th>
          <th>{{ t('table.rarity') }}</th>
          <th>{{ t('table.language') }}</th>
          <th>{{ t('table.condition') }}</th>
          <th>{{ t('table.extra') }}</th>
          <th>{{ t('price.abbr.buyMin') }}</th>
          <th>{{ t('price.abbr.buyAvg') }}</th>
          <th>{{ t('price.abbr.buyMax') }}</th>
          <th>{{ t('price.abbr.sellMin') }}</th>
          <th>{{ t('price.abbr.sellAvg') }}</th>
          <th>{{ t('price.abbr.sellMax') }}</th>
          <th>{{ t('table.status') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in cards"
          :key="idx"
          :class="{ 'row-error': row._errors && row._errors.length > 0 }"
        >
          <td><input class="editable-cell" v-model="row.edition" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model="row.number" @input="emitUpdate" style="min-width:70px" /></td>
          <td><input class="editable-cell" v-model="row.name" @input="emitUpdate" style="min-width:120px" /></td>
          <td><input class="editable-cell" v-model.number="row.quantity" type="number" style="min-width:50px;width:55px" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model="row.rarity" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model="row.language" @input="emitUpdate" style="min-width:50px;width:55px" /></td>
          <td><input class="editable-cell" v-model="row.condition" @input="emitUpdate" style="min-width:50px;width:55px" /></td>
          <td><input class="editable-cell" v-model="row.extra" @input="emitUpdate" style="min-width:70px" /></td>
          <td><input class="editable-cell" v-model.number="row.buyMin" type="number" step="0.01" style="min-width:80px" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model.number="row.buyAvg" type="number" step="0.01" style="min-width:80px" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model.number="row.buyMax" type="number" step="0.01" style="min-width:80px" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model.number="row.sellMin" type="number" step="0.01" style="min-width:80px" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model.number="row.sellAvg" type="number" step="0.01" style="min-width:80px" @input="emitUpdate" /></td>
          <td><input class="editable-cell" v-model.number="row.sellMax" type="number" step="0.01" style="min-width:80px" @input="emitUpdate" /></td>
          <td>
            <span v-if="row._errors && row._errors.length" class="badge badge-red" :title="row._errors.join(', ')">
              {{ row._errors.length }} {{ t('detail.errors') }}
            </span>
            <span v-else class="badge badge-green">{{ t('detail.ok') }}</span>
          </td>
          <td>
            <button class="btn-sm btn-danger" @click="$emit('remove', idx)">{{ t('history.deleteBtn') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { useLabels } from '@/composables/useLabels.js'

export default {
  name: 'ImportPreviewTable',
  props: {
    cards: { type: Array, required: true }
  },
  emits: ['update', 'remove'],
  setup() {
    const { t } = useLabels()
    return { t }
  },
  methods: {
    emitUpdate() {
      this.$emit('update', this.cards)
    }
  }
}
</script>
