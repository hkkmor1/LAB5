<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { RouteNamesMap } from '@/router/names';

definePage({ name: 'Login', meta: { requiresAuth: false } });

const route = useRoute();
const router = useRouter();
function goHome(): void {
  const redirectPath = route.query.redirect as string;
  if (redirectPath) {
    router.push(redirectPath);
  } else {
    router.push({ name: RouteNamesMap.HOME });
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title justify-center mb-4">Вхід у Soundboard</h2>
        <p class="text-center text-sm text-base-content/70 mb-4">
          Сторінка авторизації
        </p>
        <div class="card-actions justify-end">
          <button type="button" class="btn btn-primary w-full" @click="goHome">
            Повернутися на головну
          </button>
        </div>
      </div>
    </div>
  </div>
</template>