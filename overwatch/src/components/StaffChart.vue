<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  staffList: {
    type: Array,
    default: () => []
  }
})

let chartInstance = null
const chartRef = ref(null)

const positionStats = computed(() => {
  const map = {}
  props.staffList.forEach(s => {
    const pos = s.position || '未知'
    map[pos] = (map[pos] || 0) + 1
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
})

function ensureChart() {
  if (!chartInstance && chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
  }
}

function updateChart() {
  ensureChart()
  if (!chartInstance) return
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { color: '#333', fontSize: 11 }
    },
    series: [{
      name: '岗位分布',
      type: 'pie',
      radius: ['25%', '50%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, formatter: '{b}\n{c}人', color: '#333', fontSize: 11 } },
      data: positionStats.value
    }],
    backgroundColor: 'transparent'
  }
  chartInstance.setOption(option, true)
}

function handleResize() {
  chartInstance && chartInstance.resize()
}

watch(() => props.staffList, () => {
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
  <div ref="chartRef" class="staff-chart"></div>
</template>

<style scoped>
.staff-chart {
  width: 100%;
  height: 100%;
}
</style>
