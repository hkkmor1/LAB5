import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useToastStore } from '@/stores/toast.store';

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
    else if (status === 404) toastStore.addToast(msg, 'error');
    else toastStore.addToast('Мережева помилка', 'error');

    return Promise.reject(error);
  }
);