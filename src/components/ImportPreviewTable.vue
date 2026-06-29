<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Edição</th>
          <th>Número</th>
          <th>Nome</th>
          <th>Qtd</th>
          <th>Raridade</th>
          <th>Idioma</th>
          <th>Cond.</th>
          <th>Extra</th>
          <th>C-Menor</th>
          <th>C-Médio</th>
          <th>C-Maior</th>
          <th>V-Menor</th>
          <th>V-Médio</th>
          <th>V-Maior</th>
          <th>Status</th>
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
              {{ row._errors.length }} erro(s)
            </span>
            <span v-else class="badge badge-green">OK</span>
          </td>
          <td>
            <button class="btn-sm btn-danger" @click="$emit('remove', idx)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ImportPreviewTable',
  props: {
    cards: { type: Array, required: true }
  },
  emits: ['update', 'remove'],
  methods: {
    emitUpdate() {
      this.$emit('update', this.cards)
    }
  }
}
</script>
