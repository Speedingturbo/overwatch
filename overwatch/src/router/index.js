import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeVIew.vue'
import { isAuthenticated } from '../utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        hideNavbar: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: {
        hideNavbar: true,
      },
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/blank',
      name: 'blank',
      component: () => import('../views/backpage.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/hse',
      name: 'hse',
      component: () => import('../views/hsepage.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/text',
      name: 'text',
      component: () => import('../views/textpage.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const loggedIn = isAuthenticated()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !loggedIn) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if ((to.name === 'login' || to.name === 'register') && loggedIn) {
    return {
      name: 'home',
    }
  }

  return true
})

export default router
