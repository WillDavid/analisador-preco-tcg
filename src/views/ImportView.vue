<template>
  <div>
    <div class="page-header">
      <h1>{{ t('import.heading') }}</h1>
      <p>{{ t('import.subheading') }}</p>
    </div>

    <div v-if="!parsedData" class="card mb-6">
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('import.fileLabel') }}</label>
          <input type="file" accept=".pdf,application/pdf" @change="handleFile" ref="fileInput" />
        </div>
        <div class="form-group">
          <label>{{ t('import.dateLabel') }}</label>
          <input type="date" v-model="referenceDate" />
        </div>
      </div>

      <div v-if="errorMsg" class="alert alert-error mb-4">{{ errorMsg }}</div>

      <button
        class="btn-primary flex items-center gap-2"
        :disabled="!selectedFile || !referenceDate || processing"
        @click="processFile"
      >
        <LoaderIcon v-if="processing" :size="16" class="spinner" />
        <UploadIcon v-else :size="16" />
        {{ processing ? t('import.processing') : t('import.processBtn') }}
      </button>
    </div>

    <div v-if="parseError" class="alert alert-error mb-6">
      <AlertTriangleIcon :size="16" />
      {{ parseError }}
    </div>

    <div v-if="parsedData && !confirmed" class="card mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-bold">{{ t('import.reviewTitle') }}</h3>
          <p class="text-sm text-gray">
            {{ selectedFile?.name }} — {{ formatDate(referenceDate) }}
          </p>
        </div>
        <div class="flex gap-2">
          <button @click="handleCancel">{{ t('import.cancelBtn') }}</button>
          <button class="btn-primary" @click="handleConfirm" :disabled="saving">
            <LoaderIcon v-if="saving" :size="16" class="spinner" />
            {{ t('import.confirmBtn') }}
          </button>
        </div>
      </div>

      <div class="summary-grid mb-4">
        <div class="summary-card">
          <div class="label">{{ t('import.foundCards') }}</div>
          <div class="value">{{ parsedData.cards.length }}</div>
        </div>
        <div class="summary-card">
          <div class="label">{{ t('import.units') }}</div>
          <div class="value">{{ totalUnits }}</div>
        </div>
        <div v-if="parsedData.errors.length" class="summary-card">
          <div class="label">{{ t('import.errors') }}</div>
          <div class="value text-red">{{ parsedData.errors.length }}</div>
        </div>
        <div class="summary-card">
          <div class="label">{{ t('import.totalBuyMin') }}</div>
          <div class="value">{{ formatCurrency(parsedData.totals.buyMin) }}</div>
        </div>
        <div class="summary-card">
          <div class="label">{{ t('import.totalSellAvg') }}</div>
          <div class="value">{{ formatCurrency(parsedData.totals.sellAvg) }}</div>
        </div>
      </div>

      <div v-if="parsedData.errors.length" class="alert alert-warning mb-4">
        <AlertTriangleIcon :size="16" />
        {{ parsedData.errors.length }} {{ t('import.warningPrefix') }}
      </div>

      <ImportPreviewTable
        :cards="editableCards"
        @update="onCardUpdate"
        @remove="removeCard"
      />

      <div class="mt-4">
        <button class="btn-sm" @click="addCard">{{ t('import.addCard') }}</button>
      </div>
    </div>

    <div v-if="confirmed" class="alert alert-success mb-4">
      <CheckCircleIcon :size="16" />
      {{ t('import.success') }} {{ editableCards.length }} {{ t('import.successMsg') }} {{ formatDate(referenceDate) }}.
    </div>

    <ConfirmModal
      :visible="showConfirm"
      :title="t('import.duplicateTitle')"
      :message="t('import.duplicateMsg')"
      :confirmLabel="t('import.replaceBtn')"
      :danger="true"
      @confirm="doSave"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<script>
import { UploadIcon, LoaderIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-vue-next'
import { processPdf } from '@/services/pdfParserService.js'
import { formatBrazilianCurrency } from '@/utils/currency.js'
import { formatDate, todayStr } from '@/utils/dates.js'
import { createUniqueKey } from '@/utils/normalization.js'
import { generateId } from '@/utils/identifiers.js'
import {
  getImports,
  getImportByDate,
  saveImport,
  savePriceHistory
} from '@/services/storageService.js'
import { useLabels } from '@/composables/useLabels.js'
import ImportPreviewTable from '@/components/ImportPreviewTable.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

export default {
  name: 'ImportView',
  components: { ImportPreviewTable, ConfirmModal, UploadIcon, LoaderIcon, AlertTriangleIcon, CheckCircleIcon },
  setup() {
    const { t } = useLabels()
    return { t }
  },
  data() {
    return {
      selectedFile: null,
      referenceDate: todayStr(),
      processing: false,
      errorMsg: '',
      parsedData: null,
      editableCards: [],
      confirmed: false,
      saving: false,
      parseError: '',
      showConfirm: false
    }
  },
  computed: {
    totalUnits() {
      return this.editableCards.reduce((s, c) => s + (parseInt(c.quantity) || 0), 0)
    }
  },
  methods: {
    formatCurrency(v) { return formatBrazilianCurrency(v) },
    formatDate(v) { return formatDate(v) },

    handleFile(e) {
      this.errorMsg = ''
      this.parsedData = null
      this.confirmed = false
      this.parseError = ''
      const file = e.target.files[0]
      if (!file) return
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        this.errorMsg = this.t('error.notPdf')
        return
      }
      this.selectedFile = file
    },

    async processFile() {
      if (!this.selectedFile) return
      this.processing = true
      this.parseError = ''
      this.parsedData = null

      try {
        const result = await processPdf(this.selectedFile)
        if (result.cards.length === 0) {
          this.parseError = this.t('error.noCards')
          this.processing = false
          return
        }

        this.editableCards = result.cards.map(card => ({
          ...card,
          name: card.namePt || card.nameEn || '',
          _errors: this.validateCard(card)
        }))

        this.parsedData = result
      } catch (err) {
        console.error('Erro ao processar PDF:', err)
        this.parseError = this.t('error.process')
      } finally {
        this.processing = false
      }
    },

    validateCard(card) {
      const errors = []
      if (!card.edition) errors.push(this.t('error.editionMissing'))
      if (!card.number) errors.push(this.t('error.numberMissing'))
      if (!card.namePt && !card.nameEn) errors.push(this.t('error.nameMissing'))
      return errors
    },

    onCardUpdate(cards) {
      cards.forEach(c => {
        c._errors = this.validateCard(c)
      })
    },

    removeCard(idx) {
      this.editableCards.splice(idx, 1)
    },

    addCard() {
      this.editableCards.push({
        edition: '',
        number: '',
        name: '',
        quantity: 1,
        rarity: '',
        language: '',
        condition: '',
        extra: '',
        buyMin: null,
        buyAvg: null,
        buyMax: null,
        sellMin: null,
        sellAvg: null,
        sellMax: null,
        _errors: [this.t('error.newCard')]
      })
    },

    handleCancel() {
      this.parsedData = null
      this.editableCards = []
      this.selectedFile = null
      if (this.$refs.fileInput) this.$refs.fileInput.value = ''
    },

    handleConfirm() {
      const existing = getImportByDate(this.referenceDate)
      if (existing) {
        this.showConfirm = true
        return
      }
      this.doSave()
    },

    doSave() {
      this.showConfirm = false
      this.saving = true

      try {
        const importId = generateId()

        const cardsData = this.editableCards.map(card => ({
          ...card,
          name: card.name || card.namePt || card.nameEn || '',
          uniqueKey: createUniqueKey(card.edition, card.number, card.language || 'PT', card.condition || 'NM', card.extra || ''),
          quantity: parseInt(card.quantity) || 1
        }))

        const totals = {
          buyMin: cardsData.reduce((s, c) => s + ((c.buyMin || 0) * c.quantity), 0),
          buyAvg: cardsData.reduce((s, c) => s + ((c.buyAvg || 0) * c.quantity), 0),
          buyMax: cardsData.reduce((s, c) => s + ((c.buyMax || 0) * c.quantity), 0),
          sellMin: cardsData.reduce((s, c) => s + ((c.sellMin || 0) * c.quantity), 0),
          sellAvg: cardsData.reduce((s, c) => s + ((c.sellAvg || 0) * c.quantity), 0),
          sellMax: cardsData.reduce((s, c) => s + ((c.sellMax || 0) * c.quantity), 0)
        }

        const importRecord = {
          id: importId,
          referenceDate: this.referenceDate,
          filename: this.selectedFile?.name || '',
          importedAt: new Date().toISOString(),
          totals
        }

        const historyRecords = cardsData.map(card => ({
          importId,
          referenceDate: this.referenceDate,
          uniqueKey: card.uniqueKey,
          edition: card.edition || '',
          number: card.number || '',
          name: card.name || '',
          rarity: card.rarity || '',
          language: card.language || '',
          condition: card.condition || '',
          extra: card.extra || '',
          quantity: card.quantity || 1,
          prices: {
            buyMin: card.buyMin ?? null,
            buyAvg: card.buyAvg ?? null,
            buyMax: card.buyMax ?? null,
            sellMin: card.sellMin ?? null,
            sellAvg: card.sellAvg ?? null,
            sellMax: card.sellMax ?? null
          }
        }))

        saveImport(importRecord)
        savePriceHistory(historyRecords)
        this.confirmed = true
      } catch (err) {
        console.error('Erro ao salvar:', err)
        alert(this.t('error.saveFail'))
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
