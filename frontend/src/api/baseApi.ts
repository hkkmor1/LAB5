import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useToastStore } from '@/stores/toast.store';
import { router } from '@/router';
import { RouteNamesMap } from '@/router/names';

export const baseApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

baseApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const toastStore = useToastStore();
    const status = error.response?.status;
    const msg = error.response?.data?.message || 'Помилка сервера';

    if (status === 409) toastStore.addToast(msg, 'warning');
    else if (status === 400) toastStore.addToast(msg, 'error');
    else if (status === 401) {
      localStorage.removeItem('token');
      toastStore.addToast('Сесія закінчилася', 'error');
      router.push({ 
    name: RouteNamesMap.LOGIN, 
    query: { redirect: router.currentRoute.value.fullPath }
     });
    }
    else if (status === 404) toastStore.addToast(msg, 'error');
    else toastStore.addToast('Мережева помилка', 'error');

    return Promise.reject(error);
  }
);