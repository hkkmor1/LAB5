import { ref } from 'vue';
import { defineStore } from 'pinia';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([]);

  function addToast(text: string, type: ToastType = 'info'): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    toasts.value.push({ id, text, type });

    window.setTimeout(() => {
      removeToast(id);
    }, 3500);
  }

  function removeToast(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  return {
    toasts,
    addToast,
    removeToast
  };
});