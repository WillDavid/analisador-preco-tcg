<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div v-if="confirmText && confirmText.length > 0" class="mb-4">
        <p class="text-xs text-gray mb-2">Digite <strong>{{ confirmText }}</strong> para confirmar:</p>
        <input v-model="inputText" type="text" :placeholder="confirmText" />
      </div>
      <div v-if="details" class="mb-4">
        <div v-if="details.totalsMatch != null" class="text-xs">
          <span v-if="details.totalsMatch" class="text-green">Totais conferem ✓</span>
          <span v-else class="text-red">Divergência nos totais: R$ {{ details.totalsDiff?.toFixed(2) }}</span>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="$emit('cancel')">Cancelar</button>
        <button
          class="btn-danger"
          v-if="danger"
          :disabled="confirmText !== '' && inputText !== confirmText"
          @click="$emit('confirm')"
        >
          {{ confirmLabel || 'Confirmar' }}
        </button>
        <button
          class="btn-primary"
          v-else
          :disabled="confirmText !== '' && inputText !== confirmText"
          @click="$emit('confirm')"
        >
          {{ confirmLabel || 'Confirmar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: 'Confirmação' },
    message: { type: String, default: '' },
    confirmLabel: { type: String, default: 'Confirmar' },
    confirmText: { type: String, default: '' },
    danger: { type: Boolean, default: false },
    details: { type: Object, default: null }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return { inputText: '' }
  },
  watch: {
    visible(val) {
      if (!val) this.inputText = ''
    }
  }
}
</script>
