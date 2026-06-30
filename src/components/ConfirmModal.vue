<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div v-if="confirmText && confirmText.length > 0" class="mb-4">
        <p class="text-xs text-gray mb-2">{{ t('modal.typeConfirm') }} <strong>{{ confirmText }}</strong> {{ t('modal.typeConfirmEnd') }}</p>
        <input v-model="inputText" type="text" :placeholder="confirmText" />
      </div>
      <div v-if="details" class="mb-4">
        <div v-if="details.totalsMatch != null" class="text-xs">
          <span v-if="details.totalsMatch" class="text-green">{{ t('modal.totalsOk') }} ✓</span>
          <span v-else class="text-red">{{ t('modal.totalsDiff') }} {{ details.totalsDiff?.toFixed(2) }}</span>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="$emit('cancel')">{{ t('modal.cancel') }}</button>
        <button
          class="btn-danger"
          v-if="danger"
          :disabled="confirmText !== '' && inputText !== confirmText"
          @click="$emit('confirm')"
        >
          {{ confirmLabel || t('modal.confirm') }}
        </button>
        <button
          class="btn-primary"
          v-else
          :disabled="confirmText !== '' && inputText !== confirmText"
          @click="$emit('confirm')"
        >
          {{ confirmLabel || t('modal.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useLabels } from '@/composables/useLabels.js'

export default {
  name: 'ConfirmModal',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: 'Confirmação' },
    message: { type: String, default: '' },
    confirmLabel: { type: String, default: '' },
    confirmText: { type: String, default: '' },
    danger: { type: Boolean, default: false },
    details: { type: Object, default: null }
  },
  emits: ['confirm', 'cancel'],
  setup() {
    const { t } = useLabels()
    return { t }
  },
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
