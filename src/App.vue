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

      <!--
        TODO Task 3 — Live Graph Search
        Add a search <input> here. Pass the query string down to <Graph> as a
        new `filterQuery` prop. When the query is non-empty:
          • Nodes whose title matches (case-insensitive) render at full opacity.
          • All other nodes are dimmed to ~20% opacity inside nodeCanvasObject.
          • Show "N matches" count here and an × clear button.
        Keyboard: "/" focuses the input; Escape clears it.
        Hint: no re-init needed — the canvas loop already reads props every frame.
      -->
    </header>

    <div v-if="tab === 'graph'" class="app-body">
      <div class="graph-pane">
        <Graph
          :data="graphData"
          :selected-slug="selectedSlug"
          @select="onSelect"
          @pathSelect="onPathSelect"
          @modeChange="selectedSlug = null"
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
import { ref, watch } from 'vue'
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

function onSelect(slug) {
  selectedSlug.value = selectedSlug.value === slug ? null : slug
}

function onLocaleChange(value) {
  setLocale(value)
}

function onPathSelect(event) {
  console.log(event)
}

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
