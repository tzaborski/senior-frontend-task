<template>
  <div class="graph-wrapper">
    <div class="path-controls">
      <button
        type="button"
        :class="['path-toggle', { active: pathMode }]"
        :aria-pressed="pathMode"
        @click="togglePathMode"
      >
        {{ t('graph.path.toggle') }}
      </button>
      <span v-if="pathMode" class="path-hint">{{ pathHint }}</span>
    </div>

    <div ref="containerEl" class="graph-canvas" />

    <div v-if="pathMode && noPathFound" class="path-overlay" role="status">
      {{ t('graph.path.noPathFound') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ForceGraph from 'force-graph'
import { TYPE_COLORS, DEFAULT_TYPE_COLOR } from '../utils/types.js'
import {
  endpointSlug,
  canonicalLinkId,
  buildAdjacency,
  bfsPath,
  pathLinkIdSet,
} from '../utils/graph.js'

const props = defineProps({
  data: { type: Object, default: () => ({ nodes: [], links: [] }) },
  selectedSlug: { type: String, default: null },
  // Task 3: add filterQuery prop here and use it in nodeCanvasObject
  // filterQuery: { type: String, default: '' },
})
const emit = defineEmits(['select', 'modeChange', 'pathSelect'])
const { t } = useI18n()

const containerEl = ref(null)
let fg = null

function nodeColor(node) {
  return TYPE_COLORS[node.type] || DEFAULT_TYPE_COLOR
}

// Path mode state
const pathMode = ref(false)
const pathStart = ref(null)
const pathEnd = ref(null)
const pathSlugs = ref(new Set())
const pathLinkIds = ref(new Set())
const noPathFound = ref(false)

const pathHint = computed(() => {
  if (noPathFound.value) return t('graph.path.noPathFound')
  if (!pathStart.value) return t('graph.path.clickStart')
  if (!pathEnd.value) return t('graph.path.clickEnd')
  return t('graph.path.found')
})

// Path mode logic
function applyPath(path) {
  pathSlugs.value = new Set(path)
  pathLinkIds.value = pathLinkIdSet(path)
  noPathFound.value = false
}

function resetPathState() {
  pathStart.value = null
  pathEnd.value = null
  pathSlugs.value = new Set()
  pathLinkIds.value = new Set()
  noPathFound.value = false

  emit('modeChange', pathMode.value)
}

function togglePathMode() {
  pathMode.value = !pathMode.value
  resetPathState()
  // Seed the start endpoint from the currently-selected, if any (UX)
  if (pathMode.value && props.selectedSlug) {
    pathStart.value = props.selectedSlug
    pathSlugs.value = new Set([props.selectedSlug])
  }
}

function handlePathClick(slug) {
  // No start yet, or both already set: (re)start with this node.
  if (!pathStart.value || pathEnd.value) {
    pathStart.value = slug
    pathEnd.value = null
    pathSlugs.value = new Set([slug])
    pathLinkIds.value = new Set()
    noPathFound.value = false
    return
  }

  // Start is already set, handle end click
  pathEnd.value = slug
  const path = bfsPath(pathStart.value, slug, buildAdjacency(props.data.links))
  if (path) {
    applyPath(path)
  } else {
    pathSlugs.value = new Set([pathStart.value, slug])
    pathLinkIds.value = new Set()
    noPathFound.value = true
  }

  // Emit pathSelect event with details
  emit('pathSelect', {
    start: pathStart.value,
    end: slug,
    path,
    pathLinkIds: pathLinkIds.value,
    pathSlugs: pathSlugs.value,
    found: !!path,
  })
}

// Render helpers
function linkColorFn(link) {
  if (pathMode.value && pathLinkIds.value.size) {
    const id = canonicalLinkId(endpointSlug(link.source), endpointSlug(link.target))
    return pathLinkIds.value.has(id) ? '#ffd866' : '#1f2a3a'
  }
  return '#334455'
}

function linkWidthFn(link) {
  if (pathMode.value && pathLinkIds.value.size) {
    const id = canonicalLinkId(endpointSlug(link.source), endpointSlug(link.target))
    return pathLinkIds.value.has(id) ? 3 : 0.5
  }
  return 1
}

function drawNode(node, ctx, globalScale) {
  const isSelected = node.slug === props.selectedSlug
  const inPath = pathSlugs.value.has(node.slug)
  const dimmed = pathMode.value && pathSlugs.value.size > 0 && !inPath

  ctx.globalAlpha = dimmed ? 0.2 : 1

  const color = nodeColor(node)
  const r = isSelected ? 7 : 4

  ctx.beginPath()
  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()

  // Selection ring (only when not in path mode — path ring takes over there).
  if (isSelected && !pathMode.value) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI)
    ctx.strokeStyle = '#ffd866'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  const isStart = pathMode.value && node.slug === pathStart.value
  const isEnd = pathMode.value && node.slug === pathEnd.value

  if (pathMode.value && inPath) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI)
    ctx.strokeStyle = isStart || isEnd ? '#ffd866' : '#80c0ff'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  if (globalScale >= 1.2) {
    const fontSize = Math.min(12 / globalScale, 3)
    ctx.font = `${fontSize}px Sans-Serif`
    ctx.textAlign = 'center'
    const textY = node.y + r + fontSize + 1
    const emphasized = isSelected || (pathMode.value && inPath)

    if (emphasized) {
      const padX = 3
      const padY = 1.5
      const w = ctx.measureText(node.title).width + padX * 2
      const h = fontSize + padY * 2
      ctx.fillStyle = 'rgba(15, 26, 46, 0.9)'
      ctx.fillRect(node.x - w / 2, textY - fontSize - padY * 0.5, w, h)
      ctx.fillStyle = '#ffffff'
    } else {
      ctx.fillStyle = 'rgba(220,220,220,0.85)'
    }
    ctx.fillText(node.title, node.x, textY)
  }

  // Start / End badge above the endpoint node.
  if (isStart || isEnd) {
    const badgeFontSize = Math.min(11 / globalScale, 2.6)
    ctx.font = `600 ${badgeFontSize}px Sans-Serif`
    ctx.textAlign = 'center'
    const text = t(isStart ? 'graph.path.start' : 'graph.path.end')
    const padX = 3
    const padY = 1.5
    const w = ctx.measureText(text).width + padX * 2
    const h = badgeFontSize + padY * 2
    const bottomY = node.y - r - 3
    ctx.fillStyle = 'rgba(15, 26, 46, 0.95)'
    ctx.fillRect(node.x - w / 2, bottomY - h, w, h)
    ctx.fillStyle = '#ffd866'
    ctx.fillText(text, node.x, bottomY - padY)
  }

  ctx.globalAlpha = 1
}

// Component Lifecycle
onMounted(() => {
  fg = ForceGraph()(containerEl.value)
    .graphData(props.data)
    .nodeId('slug')
    .nodeLabel('title')
    .linkColor(linkColorFn)
    .linkWidth(linkWidthFn)
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .linkLabel('label')
    .backgroundColor('#1a1a2e')
    .onNodeClick((node) => {
      if (pathMode.value) {
        handlePathClick(node.slug)
      } else {
        emit('select', node.slug)
      }
    })
    .nodeCanvasObject(drawNode)
    .nodeCanvasObjectMode(() => 'replace')

  const { width, height } = containerEl.value.getBoundingClientRect()
  if (width && height) fg.width(width).height(height)

  const ro = new ResizeObserver(([e]) => {
    fg?.width(e.contentRect.width).height(e.contentRect.height)
  })
  ro.observe(containerEl.value)
  onUnmounted(() => ro.disconnect())
})

onUnmounted(() => {
  fg?.pauseAnimation()
  fg = null
})

watch(
  () => props.data,
  (d) => fg?.graphData(d),
)

watch(
  () => props.selectedSlug,
  (slug) => {
    if (!slug || !fg) return
    const node = fg.graphData().nodes.find((n) => n.slug === slug)
    if (node?.x != null) fg.centerAt(node.x, node.y, 400)
  },
)

// Re-bind link accessors when path state changes — nudges force-graph to
// re-render even after the simulation has cooled.
watch([pathMode, pathSlugs, pathLinkIds], () => {
  if (!fg) return
  fg.linkColor(linkColorFn).linkWidth(linkWidthFn)
})
</script>

<style scoped>
.graph-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
.graph-canvas {
  width: 100%;
  height: 100%;
}
.path-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.path-toggle {
  pointer-events: auto;
  background: #16213e;
  color: #ccc;
  border: 1px solid #1a4a80;
  padding: 5px 14px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s,
    border-color 0.1s;
}
.path-toggle:hover {
  background: #0f3460;
  color: #fff;
}
.path-toggle.active {
  background: #ffd866;
  border-color: #ffd866;
  color: #1a1a2e;
  font-weight: 600;
}
.path-hint {
  pointer-events: none;
  background: rgba(22, 33, 62, 0.85);
  color: #ccc;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #0f3460;
  white-space: nowrap;
}
.path-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(48, 22, 22, 0.92);
  color: #ffacac;
  border: 1px solid #802c2c;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.4px;
  pointer-events: none;
  z-index: 9;
}
</style>
