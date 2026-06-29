import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/importar', name: 'Importar', component: () => import('@/views/ImportView.vue') },
    { path: '/colecao', name: 'Colecao', component: () => import('@/views/CollectionView.vue') },
    { path: '/historico', name: 'Historico', component: () => import('@/views/HistoryView.vue') }
  ]
})
