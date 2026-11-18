import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import { RouteNamesMap } from '@/router/names';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const requiresAuth = to.meta.requiresAuth === true;
  const token = localStorage.getItem('token');
  
  if (requiresAuth && !token) {
    return { name: RouteNamesMap.LOGIN, query: { redirect: to.fullPath } };
  }
  
  return true;
});