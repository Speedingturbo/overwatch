<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStoredAuthUser, logoutUser } from './utils/auth'

const route = useRoute()
const router = useRouter()

const showNavbar = computed(() => !route.meta.hideNavbar)
const currentUser = ref(getStoredAuthUser())

watch(
  () => route.fullPath,
  () => {
    currentUser.value = getStoredAuthUser()
  },
  { immediate: true },
)

function openBlankPage() {
  const { href } = router.resolve('/blank')
  window.open(href, '_blank')
}

function handleLogout() {
  logoutUser()
  router.push('/login')
}
</script>

<template>
  <nav v-if="showNavbar" class="navbar">
    <div class="navbar-left">
      <button class="navbar-btn" @click="router.push('/')">项目概况</button>
      <button class="navbar-btn" @click="router.push('/hse')">HSE管理</button>
    </div>
    <div class="navbar-title">监理管理平台</div>
    <div class="navbar-right">
      <button class="navbar-btn" @click="router.push('/text')">文本分析</button>
      <button class="navbar-btn" @click="openBlankPage">系统设置</button>
    </div>
    <div class="navbar-actions">
      <span v-if="currentUser" class="navbar-user">{{ currentUser.realName || currentUser.username }}</span>
      <button class="navbar-btn" @click="handleLogout">退出登录</button>
    </div>
  </nav>

  <router-view />
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1e3a5f;
  color: #fff;
  padding: 0 24px;
  height: 56px;
  box-sizing: border-box;
  z-index: 1000;
}

.navbar-title {
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.navbar-left,
.navbar-right {
  display: flex;
  gap: 12px;
}

.navbar-left {
  margin-right: auto;
  margin-left: 25%;
}

.navbar-right {
  margin-left: auto;
  margin-right: 25%;
}

.navbar-actions {
  position: absolute;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  padding: 6px 18px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.navbar-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fff;
}

.navbar-user {
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}
</style>
