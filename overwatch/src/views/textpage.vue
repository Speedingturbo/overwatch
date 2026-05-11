<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import chinaMapSvg from '../assets/china_map.svg?raw'

// 封装 HTTP 请求工具
const api = {
  get: (url) => fetch(url).then(r => r.json()),
  post: (url, data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  del: (url) => fetch(url, { method: 'DELETE' }).then(r => r.json())
}

// 从后端 API 加载项目概况数据（用于地图标记点）
const overviewList = ref([])

async function loadOverview() {
  try {
    const res = await fetch('/api/overview')
    overviewList.value = await res.json()
  } catch {
    overviewList.value = []
  }
}

// --- 监理日报管理模块 ---
const fileList = ref([])  // 所有文件数据
const dailyReportActiveProject = ref(null)  // 当前选中的项目
const selectedDailyReportProvince = ref('')
const weeklyReportActiveProject = ref(null)
const selectedWeeklyReportProvince = ref('')
const monthlyReportActiveProject = ref(null)
const selectedMonthlyReportProvince = ref('')
const provinceNameList = ref([])

// 加载所有文件数据
async function loadFiles() {
  try {
    fileList.value = await api.get('/api/files')
  } catch {
    fileList.value = []
  }
}

// 筛选出所有监理日报
const dailyReportList = computed(() => {
  return fileList.value.filter(file => {
    const category = typeof file.category === 'string' ? file.category.trim() : ''
    return category === '监理日报'
  })
})

// 计算每个项目的日报数量
const dailyReportCountByProject = computed(() => {
  const map = {}
  dailyReportList.value.forEach(report => {
    if (report.project) {
      map[report.project] = (map[report.project] || 0) + 1
    }
  })
  return map
})

function getProvinceByLocation(location) {
  const loc = typeof location === 'string' ? location.trim() : ''
  if (!loc) return ''

  const province = provinceNameList.value.find(
    name => loc.includes(name) || name.includes(loc)
  )

  return province || ''
}

const dailyReportProvinceOptions = computed(() => {
  return [...new Set(
    overviewList.value
      .map(item => getProvinceByLocation(item.location))
      .filter(Boolean)
  )]
})

const weeklyReportProvinceOptions = computed(() => {
  return [...new Set(
    overviewList.value
      .map(item => getProvinceByLocation(item.location))
      .filter(Boolean)
  )]
})

const monthlyReportProvinceOptions = computed(() => {
  return [...new Set(
    overviewList.value
      .map(item => getProvinceByLocation(item.location))
      .filter(Boolean)
  )]
})

const filteredDailyReportProjects = computed(() => {
  if (!selectedDailyReportProvince.value) return overviewList.value

  return overviewList.value.filter(item => {
    return getProvinceByLocation(item.location) === selectedDailyReportProvince.value
  })
})

const filteredWeeklyReportProjects = computed(() => {
  if (!selectedWeeklyReportProvince.value) return overviewList.value

  return overviewList.value.filter(item => {
    return getProvinceByLocation(item.location) === selectedWeeklyReportProvince.value
  })
})

const filteredMonthlyReportProjects = computed(() => {
  if (!selectedMonthlyReportProvince.value) return overviewList.value

  return overviewList.value.filter(item => {
    return getProvinceByLocation(item.location) === selectedMonthlyReportProvince.value
  })
})

// 筛选当前项目的日报
const dailyReportForProject = computed(() => {
  if (!dailyReportActiveProject.value) return []
  return dailyReportList.value.filter(
    report => report.project === dailyReportActiveProject.value
  )
})

const weeklyReportList = computed(() => {
  return fileList.value.filter(file => {
    const category = typeof file.category === 'string' ? file.category.trim() : ''
    return category === '监理周报'
  })
})

const weeklyReportCountByProject = computed(() => {
  const map = {}
  weeklyReportList.value.forEach(report => {
    if (report.project) {
      map[report.project] = (map[report.project] || 0) + 1
    }
  })
  return map
})

const weeklyReportForProject = computed(() => {
  if (!weeklyReportActiveProject.value) return []
  return weeklyReportList.value.filter(
    report => report.project === weeklyReportActiveProject.value
  )
})

const monthlyReportList = computed(() => {
  return fileList.value.filter(file => {
    const category = typeof file.category === 'string' ? file.category.trim() : ''
    return category === '监理月报'
  })
})

const monthlyReportCountByProject = computed(() => {
  const map = {}
  monthlyReportList.value.forEach(report => {
    if (report.project) {
      map[report.project] = (map[report.project] || 0) + 1
    }
  })
  return map
})

const monthlyReportForProject = computed(() => {
  if (!monthlyReportActiveProject.value) return []
  return monthlyReportList.value.filter(
    report => report.project === monthlyReportActiveProject.value
  )
})

// 进入项目日报详情
function enterDailyReportProject(projectName) {
  dailyReportActiveProject.value = projectName
}

// 返回项目列表
function backToDailyReportList() {
  dailyReportActiveProject.value = null
}

function enterWeeklyReportProject(projectName) {
  weeklyReportActiveProject.value = projectName
}

function backToWeeklyReportList() {
  weeklyReportActiveProject.value = null
}

function enterMonthlyReportProject(projectName) {
  monthlyReportActiveProject.value = projectName
}

function backToMonthlyReportList() {
  monthlyReportActiveProject.value = null
}

watch(selectedDailyReportProvince, () => {
  if (!dailyReportActiveProject.value) return

  const existsInFilteredProjects = filteredDailyReportProjects.value.some(
    item => item.name === dailyReportActiveProject.value
  )

  if (!existsInFilteredProjects) {
    dailyReportActiveProject.value = null
  }
})

watch(selectedWeeklyReportProvince, () => {
  if (!weeklyReportActiveProject.value) return

  const existsInFilteredProjects = filteredWeeklyReportProjects.value.some(
    item => item.name === weeklyReportActiveProject.value
  )

  if (!existsInFilteredProjects) {
    weeklyReportActiveProject.value = null
  }
})

watch(selectedMonthlyReportProvince, () => {
  if (!monthlyReportActiveProject.value) return

  const existsInFilteredProjects = filteredMonthlyReportProjects.value.some(
    item => item.name === monthlyReportActiveProject.value
  )

  if (!existsInFilteredProjects) {
    monthlyReportActiveProject.value = null
  }
})

// 下载日报文件
function downloadDailyReport(report) {
  const a = document.createElement('a')
  a.href = '/api/files/' + report.id + '/download'
  a.download = report.filename || '监理日报.pdf'
  a.click()
}

function downloadWeeklyReport(report) {
  const a = document.createElement('a')
  a.href = '/api/files/' + report.id + '/download'
  a.download = report.filename || '监理周报.pdf'
  a.click()
}

function downloadMonthlyReport(report) {
  const a = document.createElement('a')
  a.href = '/api/files/' + report.id + '/download'
  a.download = report.filename || '监理月报.pdf'
  a.click()
}

// --- 文件预览 ---
const filePreviewVisible = ref(false)
const filePreviewTitle = ref('')
const filePreviewType = ref('')   // 'pdf' | 'excel' | 'docx' | 'unsupported'
const filePreviewUrl = ref('')
const filePreviewHtml = ref('')
const filePreviewLoading = ref(false)
const filePreviewError = ref('')

async function previewFile(report) {
  filePreviewTitle.value = report.filename || '文件预览'
  filePreviewHtml.value = ''
  filePreviewUrl.value = ''
  filePreviewError.value = ''
  filePreviewLoading.value = true
  filePreviewVisible.value = true

  const mime = report.mimetype || ''
  const name = (report.filename || '').toLowerCase()

  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf')
  const isDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')
  const isDoc = mime === 'application/msword' || name.endsWith('.doc')
  const isXlsx = mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || name.endsWith('.xlsx')
  const isXls = mime === 'application/vnd.ms-excel' || name.endsWith('.xls')

  try {
    if (isPdf) {
      filePreviewType.value = 'pdf'
      filePreviewUrl.value = '/api/files/' + report.id + '/download'
    } else if (isDocx) {
      filePreviewType.value = 'docx'
      const mammoth = (await import('mammoth')).default
      const res = await fetch('/api/files/' + report.id + '/download')
      const arrayBuffer = await res.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      filePreviewHtml.value = result.value
    } else if (isDoc) {
      filePreviewType.value = 'unsupported'
      filePreviewError.value = '暂不支持 .doc 格式在线预览，请下载后使用 Word 打开'
    } else if (isXlsx || isXls) {
      filePreviewType.value = 'excel'
      const XLSX = await import('xlsx')
      const res = await fetch('/api/files/' + report.id + '/download')
      const arrayBuffer = await res.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      let html = ''
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        html += `<div class="excel-sheet-label">${sheetName}</div>`
        html += XLSX.utils.sheet_to_html(sheet, { header: '', editable: false })
      })
      filePreviewHtml.value = html
    } else {
      filePreviewType.value = 'unsupported'
      filePreviewError.value = '该文件类型暂不支持在线预览'
    }
  } catch (e) {
    filePreviewType.value = 'unsupported'
    filePreviewError.value = '文件预览失败：' + (e.message || '未知错误')
  } finally {
    filePreviewLoading.value = false
  }
}

function closeFilePreview() {
  filePreviewVisible.value = false
  filePreviewUrl.value = ''
  filePreviewHtml.value = ''
}

// 删除日报
async function removeDailyReport(index) {
  const report = dailyReportForProject.value[index]
  try {
    await api.del('/api/files/' + report.id)
    const realIndex = fileList.value.findIndex(f => f.id === report.id)
    if (realIndex !== -1) {
      fileList.value.splice(realIndex, 1)
    }
  } catch (error) {
    console.error('删除日报失败', error)
  }
}

// 记录当前选中的省份id
const selectedProvinceId = ref(null)
// 记录当前显示的省份中文名
const selectedProvinceName = ref('')

// 省份id到中文名的映射
const provinceIdToName = {}
// 中文名到省份path元素的映射
const provinceNameToPath = {}

const PROJECT_DOTS_GROUP_ID = 'project-dots-group'

// 在地图上绘制项目标记红点和数量
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
  await loadFiles()

  const container = document.querySelector('.china-map')
  if (!container) return
  const svg = container.querySelector('svg')
  if (!svg) return

  // 建立省份 id↔中文名 双向映射
  svg.querySelectorAll('.land').forEach((/** @type {SVGGraphicsElement} */ path) => {
    const id = path.getAttribute('id')
    const name = path.getAttribute('title')
    if (id && name) {
      provinceIdToName[id] = name
      provinceNameToPath[name] = path
    }
  })

  provinceNameList.value = Object.keys(provinceNameToPath)

  renderProjectDots()

  const SELECTED_CLASS = 'land-selected'
  const LABEL_ID = 'province-label-text'

  // 为每个省份绑定点击事件
  svg.querySelectorAll('.land').forEach((/** @type {SVGGraphicsElement} */ path) => {
    path.addEventListener('click', function () {
      const id = path.getAttribute('id')
      if (!id) return

      // 点击同一省份则取消选中
      if (selectedProvinceId.value === id) {
        path.classList.remove(SELECTED_CLASS)
        selectedProvinceId.value = null
        selectedProvinceName.value = ''
        const oldLabel = svg.getElementById(LABEL_ID)
        if (oldLabel) oldLabel.remove()
        return
      }

      // 取消上一个选中
      if (selectedProvinceId.value) {
        const prev = svg.getElementById(selectedProvinceId.value)
        if (prev) prev.classList.remove(SELECTED_CLASS)
      }
      const oldLabel = svg.getElementById(LABEL_ID)
      if (oldLabel) oldLabel.remove()

      // 选中当前省份
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
  <!-- 左侧固定面板：监理日报管理 + 监理周报管理 -->
  <div class="side-boxes left-boxes">
    <div class="side-box">
      <div class="box-title box-title-with-filter">
        <span>监理日报管理</span>
        <select v-model="selectedDailyReportProvince" class="province-filter">
          <option value="">全部省份</option>
          <option v-for="province in dailyReportProvinceOptions" :key="province" :value="province">{{ province }}</option>
        </select>
      </div>
      
      <!-- 一级：项目列表 -->
      <div v-if="!dailyReportActiveProject" class="box-content">
        <div v-if="filteredDailyReportProjects.length" class="report-table-wrapper">
          <table class="report-table">
            <tbody>
              <tr v-for="ov in filteredDailyReportProjects" :key="ov.name">
                <td class="project-name" @click="enterDailyReportProject(ov.name)">{{ ov.name }}</td>
                <td>{{ dailyReportCountByProject[ov.name] || 0 }} 份</td>
                <td>
                  <button class="view-btn" @click="enterDailyReportProject(ov.name)">查看日报</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="box-placeholder">
          <div class="placeholder-icon">📋</div>
          <p class="placeholder-text">当前省份暂无项目数据</p>
        </div>
      </div>

      <!-- 二级：项目日报详情 -->
      <div v-else class="box-content">
        <div class="report-header">
          <button class="back-btn" @click="backToDailyReportList">← 返回</button>
          <h3 class="report-project-title">{{ dailyReportActiveProject }}</h3>
        </div>
        
        <div v-if="dailyReportForProject.length" class="report-list">
          <div v-for="report in dailyReportForProject" :key="report.id" class="report-item">
            <div class="report-info">
              <div class="report-date">{{ report.uploadTime || '未知日期' }}</div>
              <div class="report-filename">{{ report.filename || '监理日报' }}</div>
            </div>
            <div class="report-actions">
              <button class="preview-btn" @click="previewFile(report)">预览</button>
              <button class="download-btn" @click="downloadDailyReport(report)">下载</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-message">该项目暂无日报</div>
      </div>
    </div>

    <div class="side-box">
      <div class="box-title box-title-with-filter">
        <span>监理周报管理</span>
        <select v-model="selectedWeeklyReportProvince" class="province-filter">
          <option value="">全部省份</option>
          <option v-for="province in weeklyReportProvinceOptions" :key="province" :value="province">{{ province }}</option>
        </select>
      </div>

      <div v-if="!weeklyReportActiveProject" class="box-content">
        <div v-if="filteredWeeklyReportProjects.length" class="report-table-wrapper">
          <table class="report-table">
            <tbody>
              <tr v-for="ov in filteredWeeklyReportProjects" :key="ov.name">
                <td class="project-name" @click="enterWeeklyReportProject(ov.name)">{{ ov.name }}</td>
                <td>{{ weeklyReportCountByProject[ov.name] || 0 }} 份</td>
                <td>
                  <button class="view-btn" @click="enterWeeklyReportProject(ov.name)">查看周报</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="box-placeholder">
          <div class="placeholder-icon">📊</div>
          <p class="placeholder-text">当前省份暂无项目数据</p>
        </div>
      </div>

      <div v-else class="box-content">
        <div class="report-header">
          <button class="back-btn" @click="backToWeeklyReportList">← 返回</button>
          <h3 class="report-project-title">{{ weeklyReportActiveProject }}</h3>
        </div>

        <div v-if="weeklyReportForProject.length" class="report-list">
          <div v-for="report in weeklyReportForProject" :key="report.id" class="report-item">
            <div class="report-info">
              <div class="report-date">{{ report.uploadTime || '未知日期' }}</div>
              <div class="report-filename">{{ report.filename || '监理周报' }}</div>
            </div>
            <div class="report-actions">
              <button class="preview-btn" @click="previewFile(report)">预览</button>
              <button class="download-btn" @click="downloadWeeklyReport(report)">下载</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-message">该项目暂无周报</div>
      </div>
    </div>
  </div>

  <!-- 右侧固定面板：监理月报管理 + 文本生成 -->
  <div class="side-boxes right-boxes">
    <div class="side-box">
      <div class="box-title box-title-with-filter">
        <span>监理月报管理</span>
        <select v-model="selectedMonthlyReportProvince" class="province-filter">
          <option value="">全部省份</option>
          <option v-for="province in monthlyReportProvinceOptions" :key="province" :value="province">{{ province }}</option>
        </select>
      </div>

      <div v-if="!monthlyReportActiveProject" class="box-content">
        <div v-if="filteredMonthlyReportProjects.length" class="report-table-wrapper">
          <table class="report-table">
            <tbody>
              <tr v-for="ov in filteredMonthlyReportProjects" :key="ov.name">
                <td class="project-name" @click="enterMonthlyReportProject(ov.name)">{{ ov.name }}</td>
                <td>{{ monthlyReportCountByProject[ov.name] || 0 }} 份</td>
                <td>
                  <button class="view-btn" @click="enterMonthlyReportProject(ov.name)">查看月报</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="box-placeholder">
          <div class="placeholder-icon">📅</div>
          <p class="placeholder-text">当前省份暂无项目数据</p>
        </div>
      </div>

      <div v-else class="box-content">
        <div class="report-header">
          <button class="back-btn" @click="backToMonthlyReportList">← 返回</button>
          <h3 class="report-project-title">{{ monthlyReportActiveProject }}</h3>
        </div>

        <div v-if="monthlyReportForProject.length" class="report-list">
          <div v-for="report in monthlyReportForProject" :key="report.id" class="report-item">
            <div class="report-info">
              <div class="report-date">{{ report.uploadTime || '未知日期' }}</div>
              <div class="report-filename">{{ report.filename || '监理月报' }}</div>
            </div>
            <div class="report-actions">
              <button class="preview-btn" @click="previewFile(report)">预览</button>
              <button class="download-btn" @click="downloadMonthlyReport(report)">下载</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-message">该项目暂无月报</div>
      </div>
    </div>
    <div class="side-box">
      <div class="box-title">文本生成</div>
      <div class="box-placeholder">
        <div class="placeholder-icon">✏️</div>
        <p class="placeholder-text">文本生成功能开发中…</p>
      </div>
    </div>
  </div>

  <!-- 页面主体：中央区域渲染中国地图 SVG -->
  <header>
    <div class="china-map" v-html="chinaMapSvg"></div>
  </header>

  <!-- 文件预览弹窗 -->
  <div v-if="filePreviewVisible" class="file-preview-overlay" @click.self="closeFilePreview">
    <div class="file-preview-modal">
      <div class="file-preview-header">
        <span class="file-preview-title">{{ filePreviewTitle }}</span>
        <button class="file-preview-close" @click="closeFilePreview">✕</button>
      </div>
      <div class="file-preview-body">
        <div v-if="filePreviewLoading" class="file-preview-loading">加载中...</div>
        <div v-else-if="filePreviewType === 'pdf'" class="file-preview-pdf">
          <iframe :src="filePreviewUrl" frameborder="0"></iframe>
        </div>
        <div v-else-if="filePreviewType === 'docx' || filePreviewType === 'excel'" class="file-preview-html" v-html="filePreviewHtml"></div>
        <div v-else-if="filePreviewType === 'unsupported'" class="file-preview-unsupported">{{ filePreviewError }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 左右两侧固定面板容器 */
.side-boxes {
  position: fixed;
  top: 56px;
  bottom: 0;
  width: 440px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 24px 16px;
  box-sizing: border-box;
  z-index: 999;
}

.left-boxes {
  left: 0;
}

.right-boxes {
  right: 0;
}

/* 单个蓝色半透明方框样式 */
.side-box {
  width: 100%;
  height: 360px;
  background-color: rgba(15, 35, 70, 0.75);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.box-title {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background-color: rgba(30, 58, 95, 0.6);
  border-bottom: 1px solid rgba(59, 130, 246, 0.4);
}

.box-title-with-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.province-filter {
  min-width: 110px;
  padding: 4px 8px;
  font-size: 12px;
  color: #fff;
  background-color: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(147, 197, 253, 0.5);
  border-radius: 4px;
  outline: none;
}

.province-filter option {
  color: #000;
}

.box-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.box-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.placeholder-icon {
  font-size: 40px;
}

.placeholder-text {
  font-size: 14px;
  color: #fff;
  margin: 0;
}

/* 日报表格样式 */
.report-table-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table th {
  background-color: rgba(30, 58, 95, 0.5);
  color: #fff;
  padding: 8px 6px;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
}

.report-table td {
  padding: 8px 6px;
  color: #fff;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.report-table tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.project-name {
  cursor: pointer;
  color: #fff;
  text-decoration: underline;
}

.project-name:hover {
  color: #fff;
}

.view-btn {
  padding: 4px 12px;
  font-size: 12px;
  background-color: rgba(59, 130, 246, 0.8);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background-color: rgba(59, 130, 246, 1);
}

/* 日报详情页样式 */
.report-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
}

.back-btn {
  padding: 4px 12px;
  font-size: 12px;
  background-color: rgba(100, 116, 139, 0.6);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
}

.back-btn:hover {
  background-color: rgba(100, 116, 139, 0.8);
}

.report-project-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.report-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: rgba(30, 58, 95, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  transition: background-color 0.2s;
}

.report-item:hover {
  background-color: rgba(30, 58, 95, 0.5);
}

.report-info {
  flex: 1;
}

.report-date {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.report-filename {
  font-size: 12px;
  color: #fff;
}

.report-actions {
  display: flex;
  gap: 6px;
}

.download-btn,
.delete-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.download-btn {
  background-color: rgba(34, 197, 94, 0.8);
  color: #fff;
}

.download-btn:hover {
  background-color: rgba(34, 197, 94, 1);
}

.delete-btn {
  background-color: rgba(239, 68, 68, 0.8);
  color: #fff;
}

.delete-btn:hover {
  background-color: rgba(239, 68, 68, 1);
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #fff;
  font-size: 13px;
}

/* 页面头部区域，用于放置中国地图 */
header {
  grid-column: 1 / -1;
  margin-top: 56px;
}

/* 中国地图容器：水平居中，限制最大宽度 */
.china-map {
  width: 90vw;
  max-width: 600px;
  height: auto;
  display: block;
  margin: 0 auto;
}

/* 使内嵌 SVG 自适应容器宽度 */
.china-map :deep(svg) {
  width: 100%;
  height: auto;
}

/* 省份 path 元素默认样式 */
.china-map :deep(.land) {
  cursor: pointer;
  transition: fill 0.2s;
}

/* 鼠标悬停时省份高亮为蓝色 */
.china-map :deep(.land:hover) {
  fill: #3b82f6;
}

/* 被选中的省份强制蓝色填充 */
.china-map :deep(.land-selected) {
  fill: #3b82f6 !important;
}

/* 项目标记圆点红色发光阴影 */
.china-map :deep(#project-dots-group circle) {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
}

/* 预览按钮 */
.preview-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
  background-color: rgba(99, 102, 241, 0.85);
  color: #fff;
}

.preview-btn:hover {
  background-color: rgba(99, 102, 241, 1);
}

/* 文件预览弹窗遮罩 */
.file-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 32px;
  box-sizing: border-box;
  z-index: 2000;
}

.file-preview-modal {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 960px;
  max-height: calc(100vh - 64px);
  overflow: hidden;
}

.file-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.file-preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a5f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-preview-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #888;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.file-preview-close:hover {
  background: #f0f0f0;
  color: #333;
}

.file-preview-body {
  flex: 1;
  overflow: auto;
  position: relative;
}

.file-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-size: 15px;
  color: #888;
}

.file-preview-pdf {
  width: 100%;
  height: 100%;
}

.file-preview-pdf iframe {
  width: 100%;
  height: 100%;
  min-height: 600px;
  display: block;
}

.file-preview-html {
  padding: 24px 28px;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}

.file-preview-html :deep(table) {
  border-collapse: collapse;
  width: auto;
  max-width: 100%;
  margin-bottom: 16px;
  font-size: 13px;
}

.file-preview-html :deep(td),
.file-preview-html :deep(th) {
  border: 1px solid #ccc;
  padding: 5px 10px;
  text-align: left;
  white-space: nowrap;
}

.excel-sheet-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
  background: #e8f0fa;
  padding: 4px 10px;
  border-radius: 3px;
  display: inline-block;
  margin-bottom: 8px;
  margin-top: 12px;
}

.file-preview-unsupported {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-size: 15px;
  color: #888;
  text-align: center;
  padding: 24px;
}
</style>

