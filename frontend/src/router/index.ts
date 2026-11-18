import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});