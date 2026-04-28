<script setup>
import { onMounted, ref } from 'vue'
import chinaMapSvg from '../assets/china_map.svg?raw'

const overviewList = ref([])

async function loadOverview() {
  try {
    const res = await fetch('/api/overview')
    overviewList.value = await res.json()
  } catch {
    overviewList.value = []
  }
}

const selectedProvinceId = ref(null)
const selectedProvinceName = ref('')

const provinceIdToName = {}
const provinceNameToPath = {}

const PROJECT_DOTS_GROUP_ID = 'project-dots-group'

function renderProjectDots() {
  const container = document.querySelector('.china-map')
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return

  const oldGroup = svg.getElementById(PROJECT_DOTS_GROUP_ID)
  if (oldGroup) oldGroup.remove()

  if (!overviewList.value.length) return

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.setAttribute('id', PROJECT_DOTS_GROUP_ID)
  group.setAttribute('pointer-events', 'none')

  const provinceCount = {}
  overviewList.value.forEach(item => {
    const loc = item.location.trim()
    for (const [name] of Object.entries(provinceNameToPath)) {
      if (loc.includes(name) || name.includes(loc)) {
        provinceCount[name] = (provinceCount[name] || 0) + 1
        break
      }
    }
  })

  for (const [name, count] of Object.entries(provinceCount)) {
    const pathEl = provinceNameToPath[name]
    if (!pathEl) continue
    const bbox = pathEl.getBBox()
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', cx)
    circle.setAttribute('cy', cy)
    circle.setAttribute('r', '8')
    circle.setAttribute('fill', '#ef4444')
    circle.setAttribute('stroke', '#fff')
    circle.setAttribute('stroke-width', '2')

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', cx)
    text.setAttribute('y', cy)
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'central')
    text.setAttribute('font-size', '10')
    text.setAttribute('fill', '#fff')
    text.setAttribute('font-weight', 'bold')
    text.textContent = String(count)

    group.appendChild(circle)
    group.appendChild(text)
  }

  svg.appendChild(group)
}

onMounted(async () => {
  await loadOverview()

  const container = document.querySelector('.china-map')
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return

  svg.querySelectorAll('.land').forEach((/** @type {SVGGraphicsElement} */ path) => {
    const id = path.getAttribute('id')
    const name = path.getAttribute('title')
    if (id && name) {
      provinceIdToName[id] = name
      provinceNameToPath[name] = path
    }
  })

  renderProjectDots()

  const SELECTED_CLASS = 'land-selected'
  const LABEL_ID = 'province-label-text'

  svg.querySelectorAll('.land').forEach((/** @type {SVGGraphicsElement} */ path) => {
    path.addEventListener('click', function () {
      const id = path.getAttribute('id')
      if (!id) return

      if (selectedProvinceId.value === id) {
        path.classList.remove(SELECTED_CLASS)
        selectedProvinceId.value = null
        selectedProvinceName.value = ''
        const oldLabel = svg.getElementById(LABEL_ID)
        if (oldLabel) oldLabel.remove()
        return
      }

      if (selectedProvinceId.value) {
        const prev = svg.getElementById(selectedProvinceId.value)
        if (prev) prev.classList.remove(SELECTED_CLASS)
      }
      const oldLabel = svg.getElementById(LABEL_ID)
      if (oldLabel) oldLabel.remove()

      path.classList.add(SELECTED_CLASS)
      selectedProvinceId.value = id
      selectedProvinceName.value = provinceIdToName[id] || ''

      const bbox = path.getBBox()
      const cx = bbox.x + bbox.width / 2
      const cy = bbox.y + 20

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.setAttribute('id', LABEL_ID)
      group.setAttribute('pointer-events', 'none')

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', cx)
      text.setAttribute('y', cy)
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'auto')
      text.setAttribute('font-size', '18')
      text.setAttribute('fill', '#fff')
      text.textContent = selectedProvinceName.value

      svg.appendChild(text)
      const textBBox = text.getBBox()
      text.remove()

      const padX = 8
      const padY = 4
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', textBBox.x - padX)
      rect.setAttribute('y', textBBox.y - padY)
      rect.setAttribute('width', textBBox.width + padX * 2)
      rect.setAttribute('height', textBBox.height + padY * 2)
      rect.setAttribute('rx', '4')
      rect.setAttribute('ry', '4')
      rect.setAttribute('fill', 'rgba(0, 0, 0, 0.65)')

      group.appendChild(rect)
      group.appendChild(text)
      svg.appendChild(group)
    })
  })
})
</script>

<template>
  <header>
    <div class="china-map" v-html="chinaMapSvg"></div>
  </header>
</template>

<style scoped>
header {
  grid-column: 1 / -1;
  margin-top: 56px;
}

.china-map {
  width: 90vw;
  max-width: 600px;
  height: auto;
  display: block;
  margin: 0 auto;
}

.china-map :deep(svg) {
  width: 100%;
  height: auto;
}

.china-map :deep(.land) {
  cursor: pointer;
  transition: fill 0.2s;
}

.china-map :deep(.land:hover) {
  fill: #3b82f6;
}

.china-map :deep(.land-selected) {
  fill: #3b82f6 !important;
}

.china-map :deep(#project-dots-group circle) {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
}
</style>
