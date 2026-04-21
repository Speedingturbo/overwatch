<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  riskList: {
    type: Array,
    default: () => []
  },
  overviewList: {
    type: Array,
    default: () => []
  }
})

const riskLevels = ['低', '中', '高', '重大']
const riskLevelColors = { '低': '#27ae60', '中': '#f39c12', '高': '#e74c3c', '重大': '#8e44ad' }

const stats = computed(() => {
  const projectNames = props.overviewList.map(ov => ov.name)
  const map = {}
  projectNames.forEach(name => {
    map[name] = { '低': 0, '中': 0, '高': 0, '重大': 0 }
  })
  props.riskList.forEach(r => {
    if (r.project && map[r.project] && riskLevels.includes(r.level)) {
      map[r.project][r.level]++
    }
  })
  return { projectNames, map }
})

let chartInstance = null
const chartRef = ref(null)

function ensureChart() {
  if (!chartInstance && chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
  }
}

function updateChart() {
  ensureChart()
  if (!chartInstance) return
  const { projectNames, map } = stats.value
  const series = riskLevels.map(level => ({
    name: level,
    type: 'bar',
    stack: 'risk',
    barMaxWidth: 30,
    itemStyle: { color: riskLevelColors[level] },
    label: {
      show: true,
      position: 'inside',
      formatter: (params) => params.value > 0 ? params.value : '',
      color: '#fff',
      fontSize: 10
    },
    data: projectNames.map(name => map[name][level])
  }))
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: riskLevels, top: 4, textStyle: { color: '#ccc', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: projectNames,
      axisLabel: { rotate: projectNames.length > 4 ? 30 : 0, color: '#ccc', fontSize: 11 },
      axisLine: { lineStyle: { color: '#555' } }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      nameTextStyle: { color: '#ccc', fontSize: 11 },
      minInterval: 1,
      axisLabel: { color: '#ccc', fontSize: 11 },
      axisLine: { lineStyle: { color: '#555' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series,
    grid: { left: 50, right: 16, top: 40, bottom: 40 },
    backgroundColor: 'transparent'
  }
  chartInstance.setOption(option, true)
}

function handleResize() {
  chartInstance && chartInstance.resize()
}

watch([() => props.riskList, () => props.overviewList], () => {
  nextTick(() => updateChart())
}, { deep: true })

onMounted(() => {
  nextTick(() => updateChart())
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div ref="chartRef" class="risk-bar-chart"></div>
</template>

<style scoped>
.risk-bar-chart {
  width: 100%;
  height: 100%;
}
</style>
