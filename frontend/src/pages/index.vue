<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
  Flame, Volume2, VolumeX, Search, Shuffle,
  PlusCircle, Trophy, AlertCircle, Keyboard, X,
  ChevronLeft, ChevronRight
} from 'lucide-vue-next';
import SoundLaunchpadGrid from '@/components/SoundLaunchpadGrid.vue';
import { useSounds } from '@/composables/useSounds';
import { useAudioStore } from '@/stores/audio.store';
import { useToastStore } from '@/stores/toast.store';
import type { Sound, SoundCategory, DaisyColor } from '@/types/sound';

definePage({ name: 'SoundboardHome', meta: { requiresAuth: false } });

const router = useRouter();

const {
  sounds, stats, activeSoundId, isLoading, error,
  fetchSounds, fetchStats, playSound, addSound,
  updateSoundItem, toggleFavorite, removeSound, triggerRandomSound
} = useSounds();

const audioStore = useAudioStore();
const { volume, isMuted } = storeToRefs(audioStore);
const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);

const selectedCategory = ref<string>('all');
const searchQuery = ref<string>('');
const categories = [
  { value: 'all', label: 'Всі' },
  { value: 'memes', label: 'Меми' },
  { value: 'games', label: 'Ігри' },
  { value: 'reactions', label: 'Реакції' },
  { value: 'anime', label: 'Аніме' },
  { value: 'cinema', label: 'Кіно' }
];
const colorOptions: DaisyColor[] = ['primary', 'secondary', 'accent', 'warning', 'error', 'info'];

watch([selectedCategory, searchQuery], () => {
  void fetchSounds(
    selectedCategory.value === 'all' ? undefined : selectedCategory.value,
    searchQuery.value.trim() || undefined
  );
});

const isModalOpen = ref<boolean>(false);
const editingSoundId = ref<string | null>(null);
const isListeningHotkey = ref<boolean>(false);

interface SoundFormState {
  title: string;
  audio_url: string;
  category: SoundCategory;
  color: DaisyColor;
  hotkey: string | null;
}

const initialFormState: SoundFormState = { title: '', audio_url: '', category: 'memes', color: 'primary', hotkey: null };
const formState = ref<SoundFormState>({ ...initialFormState });
const savedFormState = ref<SoundFormState>({ ...initialFormState });

const isDirty = computed<boolean>(() => {
  if (!isModalOpen.value) return false;
  return formState.value.title !== savedFormState.value.title ||
         formState.value.audio_url !== savedFormState.value.audio_url ||
         formState.value.category !== savedFormState.value.category ||
         formState.value.color !== savedFormState.value.color ||
         formState.value.hotkey !== savedFormState.value.hotkey;
});

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return window.confirm('Є незбережені зміни в формі. Покинути сторінку?');
  }
  return true;
});

function openCreateModal(): void {
  editingSoundId.value = null;
  formState.value = { ...initialFormState };
  savedFormState.value = { ...initialFormState };
  isModalOpen.value = true;
}

function openEditModal(sound: Sound): void {
  editingSoundId.value = sound.id;
  const current: SoundFormState = { title: sound.title, audio_url: sound.audio_url, category: sound.category, color: sound.color, hotkey: sound.hotkey };
  formState.value = { ...current };
  savedFormState.value = { ...current };
  isModalOpen.value = true;
}

function closeModal(): void {
  if (isDirty.value && !window.confirm('Закрити без збереження?')) return;
  isModalOpen.value = false;
  isListeningHotkey.value = false;
}

function captureHotkey(event: KeyboardEvent): void {
  if (!isListeningHotkey.value) return;
  event.preventDefault();
  event.stopPropagation();
  formState.value.hotkey = event.key === 'Escape' ? null : event.code;
  isListeningHotkey.value = false;
}

async function handleFormSubmit(): Promise<void> {
  let success = false;
  if (editingSoundId.value) {
    success = await updateSoundItem(editingSoundId.value, formState.value);
  } else {
    success = await addSound(formState.value);
  }
  if (success) {
    savedFormState.value = { ...formState.value };
    isModalOpen.value = false;
  }
}

onMounted(() => {
  void fetchSounds();
  void fetchStats();
});
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content p-4 md:p-8 flex flex-col gap-6">
    <header class="navbar bg-base-200 rounded-box shadow-md px-4 py-3 flex-wrap gap-4 justify-between">
      <div class="flex items-center gap-4 flex-wrap">
        
        <div class="flex items-center gap-1 bg-base-100 rounded-btn p-1 shadow-sm">
          <button type="button" class="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom" data-tip="Назад" @click="router.back()">
            <ChevronLeft class="w-5 h-5" />
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom" data-tip="Вперед" @click="router.forward()">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <h1 class="text-2xl font-extrabold flex items-center gap-2">
          <Volume2 class="w-7 h-7 text-primary" /> Meme Soundboard
        </h1>
        <div v-if="stats?.sound_of_the_day" class="badge badge-lg badge-secondary gap-2 py-4 px-3 shadow-sm">
          <Flame class="w-4 h-4" /> Звук дня: {{ stats.sound_of_the_day.title }} ({{ stats.sound_of_the_day.play_count }})
          <button type="button" class="btn btn-xs btn-circle btn-ghost" @click="playSound(stats.sound_of_the_day, 'click')">
            <Volume2 class="w-3.5 h-3.5" />
          </button>
        </div>
        <div v-if="stats" class="badge badge-outline gap-1.5 py-3">
          <Trophy class="w-3.5 h-3.5 text-warning" /> Всього запусків: {{ stats.total_plays }}
        </div>
      </div>
      
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded-btn">
          <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="audioStore.toggleMute()">
            <VolumeX v-if="isMuted" class="w-4 h-4 text-error" />
            <Volume2 v-else class="w-4 h-4 text-primary" />
          </button>
          <input type="range" min="0" max="1" step="0.05" :value="isMuted ? 0 : volume" class="range range-xs range-primary w-24" @input="audioStore.setVolume(Number(($event.target as HTMLInputElement).value))" />
        </div>
        <label class="input input-bordered input-sm flex items-center gap-2">
          <Search class="w-4 h-4 opacity-60" />
          <input v-model="searchQuery" type="text" placeholder="Пошук мему..." class="grow" />
        </label>
        <button type="button" class="btn btn-accent btn-sm gap-1.5" @click="triggerRandomSound()">
          <Shuffle class="w-4 h-4" /> Рандомний мем
        </button>
        <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="openCreateModal()">
          <PlusCircle class="w-4 h-4" /> Додати звук
        </button>
      </div>
    </header>

    <nav class="flex items-center justify-between flex-wrap gap-3">
      <div role="tablist" class="tabs tabs-boxed bg-base-200 p-1">
        <button v-for="cat in categories" :key="cat.value" type="button" role="tab" class="tab font-medium" :class="selectedCategory === cat.value ? 'tab-active' : ''" @click="selectedCategory = cat.value">
          {{ cat.label }}
        </button>
      </div>
    </nav>

    <div v-if="isLoading" class="flex justify-center items-center py-16">
      <span class="loading loading-ring loading-lg text-primary"></span>
    </div>
    <div v-else-if="error" class="alert alert-error shadow-md">
      <AlertCircle class="w-5 h-5" /> <span>{{ error }}</span>
    </div>
    <SoundLaunchpadGrid v-else :sounds="sounds" :active-sound-id="activeSoundId" @play="playSound" @toggle-favorite="toggleFavorite" @edit="openEditModal" @delete="removeSound" />

    <dialog class="modal" :class="isModalOpen ? 'modal-open' : ''">
      <div class="modal-box">
        <div class="flex items-center justify-between pb-3 border-b border-base-300">
          <h3 class="font-bold text-lg">{{ editingSoundId ? 'Редагувати звук' : 'Новий мем-звук' }}</h3>
          <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="closeModal()"><X class="w-4 h-4" /></button>
        </div>
        <form class="flex flex-col gap-4 mt-4" @submit.prevent="handleFormSubmit">
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Назва звуку</span></label>
            <input v-model="formState.title" type="text" required placeholder="Наприклад: Vine Boom" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">URL аудіофайлу (mp3/wav)</span></label>
            <input v-model="formState.audio_url" type="text" required placeholder="https://example.com/sound.mp3" class="input input-bordered w-full" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label"><span class="label-text font-medium">Категорія</span></label>
              <select v-model="formState.category" class="select select-bordered w-full">
                <option value="memes">Меми</option>
                <option value="games">Ігри</option>
                <option value="reactions">Реакції</option>
                <option value="anime">Аніме</option>
                <option value="cinema">Кіно</option>
                </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-medium">Колір кнопки</span></label>
              <select v-model="formState.color" class="select select-bordered w-full">
                <option v-for="col in colorOptions" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Гаряча клавіша</span></label>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-outline flex-1 gap-2 font-mono" :class="isListeningHotkey ? 'btn-warning animate-pulse' : ''" @click="isListeningHotkey = true" @keydown="captureHotkey">
                <Keyboard class="w-4 h-4" />
                <span v-if="isListeningHotkey">Натисніть клавішу (Esc — скидання)</span>
                <span v-else>{{ formState.hotkey ?? 'Призначити клавішу' }}</span>
              </button>
              <button v-if="formState.hotkey" type="button" class="btn btn-ghost btn-sm" @click="formState.hotkey = null">Скинути</button>
            </div>
          </div>
          <p v-show="isDirty" class="text-warning text-xs font-medium">У формі є незбережені зміни</p>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeModal()">Скасувати</button>
            <button type="submit" class="btn btn-primary">Зберегти</button>
          </div>
        </form>
      </div>
    </dialog>

    <div class="toast toast-end toast-bottom z-50">
      <div v-for="item in toasts" :key="item.id" class="alert shadow-lg" :class="`alert-${item.type}`">
        <span>{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>