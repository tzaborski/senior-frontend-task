<template>
  <div class="app">
    <header class="app-header">
      <h1>{{ t('app.title') }}</h1>
      <nav class="tabs">
        <button :class="['tab', { active: tab === 'graph' }]" @click="tab = 'graph'">
          {{ t('tabs.graph') }}
        </button>
        <button :class="['tab', { active: tab === 'sources' }]" @click="tab = 'sources'">
          {{ t('tabs.sources') }}
        </button>
      </nav>
      <div v-if="tab === 'graph'" class="graph-search">
        <div class="graph-search-wrap">
          <input
            ref="searchInputRef"
            v-model="filterQuery"
            type="search"
            :placeholder="t('graph.search.placeholder')"
            :aria-label="t('graph.search.placeholder')"
            class="graph-search-input"
          />
          <button
            v-if="filterQuery"
            type="button"
            class="graph-search-clear"
            :aria-label="t('graph.search.clear')"
            :title="t('graph.search.clear')"
            @click="clearSearch"
          >
            &#x2715;
          </button>
        </div>
        <span v-if="filterQuery" class="graph-search-count">
          {{ t('graph.search.matches', { count: matchCount }, matchCount) }}
        </span>
      </div>

      <span v-if="tab === 'graph'" class="status">
        {{
          t('graph.status', {
            chunks: t('graph.chunks', { count: graphData.nodes.length }, graphData.nodes.length),
            links: t('graph.links', { count: graphData.links.length }, graphData.links.length),
          })
        }}
      </span>

      <div class="lang-switcher" :class="{ 'no-status': tab !== 'graph' }">
        <label for="lang-select" class="visually-hidden">{{ t('app.language') }}</label>
        <select
          id="lang-select"
          :value="locale"
          aria-label="Language"
          @change="onLocaleChange($event.target.value)"
        >
          <option v-for="loc in SUPPORTED_LOCALES" :key="loc" :value="loc">
            {{ loc.toUpperCase() }}
          </option>
        </select>
      </div>
    </header>

    <div v-if="tab === 'graph'" class="app-body">
      <div class="graph-pane">
        <Graph
          :data="graphData"
          :selected-slug="selectedSlug"
          :filter-query="filterQuery"
          @select="onSelect"
          @pathSelect="onPathSelect"
          @modeChange="onModeChange"
        />
      </div>
      <div :class="['detail-pane', { open: !!selectedSlug }]">
        <div v-if="chunkLoading" class="panel-loading">{{ t('app.loading') }}</div>
        <ChunkPanel
          v-else-if="chunk"
          :chunk="chunk"
          @navigate="selectedSlug = $event"
          @close="selectedSlug = null"
        />
        <div v-else class="empty-state">{{ t('app.selectNode') }}</div>
      </div>
    </div>

    <SourcesView v-if="tab === 'sources'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphData, getChunk } from './data/mock.js'
import Graph from './components/Graph.vue'
import ChunkPanel from './components/ChunkPanel.vue'
import SourcesView from './components/SourcesView.vue'
import { SUPPORTED_LOCALES, setLocale } from './i18n.js'

const { t, locale } = useI18n()

const tab = ref('graph')
const selectedSlug = ref(null)
const chunk = ref(null)
const chunkLoading = ref(false)

const filterQuery = ref('')
const searchInputRef = ref(null)

const matchCount = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return 0
  return graphData.nodes.filter((n) => n.title.toLowerCase().includes(q)).length
})

function clearSearch() {
  filterQuery.value = ''
  searchInputRef.value?.focus()
}

function onSelect(slug) {
  selectedSlug.value = selectedSlug.value === slug ? null : slug
}

function onModeChange() {
  selectedSlug.value = null

  // UX decision: when toggling path mode, clear the search query to avoid
  // confusion between dimming from path vs dimming from search filter.

  // filterQuery.value = ''
}

function onLocaleChange(value) {
  setLocale(value)
}

function onPathSelect(event) {
  console.log(event)
}

function onKeydown(e) {
  if (e.key === '/' && tab.value === 'graph') {
    const target = e.target
    const inOtherEditable =
      target !== searchInputRef.value &&
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    if (inOtherEditable) return
    // Prevent '/' from being typed into the search input itself.
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }
  if (e.key === 'Escape' && document.activeElement === searchInputRef.value) {
    if (filterQuery.value) {
      filterQuery.value = ''
    } else {
      searchInputRef.value?.blur()
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

watch(selectedSlug, async (slug) => {
  if (!slug) {
    chunk.value = null
    return
  }
  chunkLoading.value = true
  await new Promise((r) => setTimeout(r, 80))
  chunk.value = getChunk(slug)
  chunkLoading.value = false
})
</script>

<style>
.graph-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.graph-search-wrap {
  position: relative;
}

.graph-search-input {
  background: #0f1e38;
  color: #e8e8e8;
  border: 1px solid #1a4a80;
  border-radius: 4px;
  padding: 4px 24px 4px 8px;
  font-size: 12px;
  width: 200px;
  outline: none;
  transition: border-color 0.1s;
}

.graph-search-input::placeholder {
  color: #555;
}

.graph-search-input:focus {
  border-color: #2a5fa0;
}

/* Hide native search clear (we render our own × button). */
.graph-search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.graph-search-clear {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 2px;
}

.graph-search-clear:hover {
  color: #ccc;
}

.graph-search-count {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}

.lang-switcher {
  margin-left: auto;
}

.lang-switcher.no-status {
  /* keep right-aligned even when status hidden */
  margin-left: auto;
}

.status + .lang-switcher {
  margin-left: 0;
}

.graph-search ~ .status {
  /* search already pushes itself right; status sits flush after it. */
  margin-left: 0;
}

.lang-switcher select {
  background: #0f3460;
  color: #e8e8e8;
  border: 1px solid #1a4a80;
  border-radius: 4px;
  font-size: 12px;
  padding: 3px 6px;
  cursor: pointer;
}

.lang-switcher select:hover {
  border-color: #2a5fa0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
