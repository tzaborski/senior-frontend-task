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