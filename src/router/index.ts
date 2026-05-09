import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/ai',
    name: 'Ai',
    component: () => import('@/views/AiView.vue')
  },
  {
    path: '/plant/new',
    name: 'PlantNew',
    component: () => import('@/views/PlantFormView.vue')
  },
  {
    path: '/plant/:id',
    name: 'PlantDetail',
    component: () => import('@/views/PlantDetailView.vue')
  },
  {
    path: '/plant/:id/edit',
    name: 'PlantEdit',
    component: () => import('@/views/PlantFormView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
