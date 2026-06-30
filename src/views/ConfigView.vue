<template>
  <div>
    <div class="page-header">
      <h1>{{ t('config.heading') }}</h1>
      <p>{{ t('config.subheading') }}</p>
    </div>

    <div class="card mb-6">
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label>{{ t('config.urlLabel') }}</label>
          <input v-model="url" type="text" :placeholder="t('config.urlPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ t('config.intervalLabel') }}</label>
          <select v-model="intervalMs">
            <option :value="60000">{{ t('config.interval1m') }}</option>
            <option :value="300000">{{ t('config.interval5m') }}</option>
            <option :value="600000">{{ t('config.interval10m') }}</option>
            <option :value="1800000">{{ t('config.interval30m') }}</option>
            <option :value="3600000">{{ t('config.interval1h') }}</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" @click="saveConfig" :disabled="!url">
        <SaveIcon :size="16" />
        {{ t('config.saveBtn') }}
      </button>
    </div>

    <div class="card mb-6">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-bold">{{ t('config.status') }}</h3>
        <div class="flex gap-2">
          <button
            class="btn-sm"
            :class="status.paused ? 'btn-primary' : ''"
            @click="status.paused ? resume() : pause()"
          >
            {{ status.paused ? t('config.resume') : t('config.pause') }}
          </button>
          <button class="btn-primary btn-sm" @click="forceNow" :disabled="scraping">
            <LoaderIcon v-if="scraping" :size="14" class="spinner" />
            <RefreshCwIcon v-else :size="14" />
            {{ scraping ? t('config.scraping') : t('config.forceNow') }}
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">{{ t('config.state') }}</div>
          <div class="value">
            <span :class="status.running ? 'text-green' : 'text-gray'">
              {{ status.running ? t('config.online') : t('config.idle') }}
            </span>
          </div>
        </div>
        <div class="summary-card">
          <div class="label">{{ t('config.lastScrape') }}</div>
          <div class="value text-sm">{{ status.lastScrape ? formatDateTime(status.lastScrape.time) : t('config.never') }}</div>
        </div>
        <div class="summary-card">
          <div class="label">{{ t('config.lastCards') }}</div>
          <div class="value">{{ status.lastScrape ? status.lastScrape.cards : '—' }}</div>
        </div>
        <div class="summary-card">
          <div class="label">{{ t('config.lastTotal') }}</div>
          <div class="value">{{ status.lastScrape ? formatCurrency(status.lastScrape.totals.buyMin) : '—' }}</div>
        </div>
      </div>

      <div v-if="status.lastError" class="alert alert-error mt-3">
        <AlertTriangleIcon :size="14" />
        {{ status.lastError }}
      </div>
    </div>
  </div>
</template>

<script>
import { SaveIcon, RefreshCwIcon, LoaderIcon, AlertTriangleIcon } from 'lucide-vue-next'
import { formatBrazilianCurrency } from '@/utils/currency.js'
import { formatDateTime } from '@/utils/dates.js'
import { useLabels } from '@/composables/useLabels.js'

export default {
  name: 'ConfigView',
  components: { SaveIcon, RefreshCwIcon, LoaderIcon, AlertTriangleIcon },
  setup() {
    const { t } = useLabels()
    return { t }
  },
  data() {
    return {
      url: '',
      intervalMs: 300000,
      status: { running: false, paused: false, lastScrape: null, lastError: null },
      scraping: false
    }
  },
  methods: {
    formatCurrency(v) { return formatBrazilianCurrency(v) },
    formatDateTime(v) { return formatDateTime(v) },
    async loadStatus() {
      try {
        const res = await fetch('/api/scrape/status')
        const data = await res.json()
        this.status = data
        this.url = data.url || ''
        this.intervalMs = data.interval || 300000
      } catch {}
    },
    async saveConfig() {
      try {
        const res = await fetch('/api/scrape/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: this.url, intervalMs: this.intervalMs })
        })
        this.status = await res.json()
      } catch {}
    },
    async pause() {
      const res = await fetch('/api/scrape/pause', { method: 'POST' })
      this.status = await res.json()
    },
    async resume() {
      const res = await fetch('/api/scrape/resume', { method: 'POST' })
      this.status = await res.json()
    },
    async forceNow() {
      this.scraping = true
      try {
        const res = await fetch('/api/scrape/now', { method: 'POST' })
        const data = await res.json()
        if (data.error) alert(data.error)
        await this.loadStatus()
      } catch (e) {
        alert(e.message)
      } finally {
        this.scraping = false
      }
    }
  },
  async mounted() {
    await this.loadStatus()
  }
}
</script>
