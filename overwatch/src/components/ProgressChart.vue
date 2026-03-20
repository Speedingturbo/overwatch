<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  }
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
  const list = props.projects
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: list.map((p) => p.name),
      axisLabel: {
        rotate: list.length > 4 ? 30 : 0,
        color: '#ccc',
        fontSize: 11
      },
      axisLine: { lineStyle: { color: '#555' } }
    },
    yAxis: {
      type: 'value',
      name: '进度(%)',
      nameTextStyle: { color: '#ccc', fontSize: 11 },
      min: 0,
      max: 100,
      axisLabel: { color: '#ccc', fontSize: 11 },
      axisLine: { lineStyle: { color: '#555' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: '项目进度',
        type: 'bar',
        data: list.map((p) => p.progress),
        barMaxWidth: 30,
        itemStyle: { color: '#3398DB' },
        label: { show: true, position: 'top', formatter: '{c}%', color: '#ccc', fontSize: 10 }
      }
    ],
    grid: { left: 50, right: 16, top: 36, bottom: 40 },
    backgroundColor: 'transparent'
  }
  chartInstance.setOption(option, true)
}

function handleResize() {
  chartInstance && chartInstance.resize()
}

watch(() => props.projects, () => {
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
  <div ref="chartRef" class="progress-chart"></div>
</template>

<style scoped>
.progress-chart {
  width: 100%;
  height: 100%;
}
</style>
