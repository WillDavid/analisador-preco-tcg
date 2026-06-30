import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', alias: '/painel', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/config', alias: '/importar', name: 'Config', component: () => import('@/views/ConfigView.vue') },
    { path: '/colecao', alias: '/base', name: 'Colecao', component: () => import('@/views/CollectionView.vue') },
    { path: '/historico', alias: '/log', name: 'Historico', component: () => import('@/views/HistoryView.vue') }
  ]
})
