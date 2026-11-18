import { ref, watch } from 'vue';
import axios from 'axios';
import { storeToRefs } from 'pinia';
import { soundService } from '@/services/soundService';
import { useAudioStore } from '@/stores/audio.store';
import { useToastStore } from '@/stores/toast.store';
import type {
  Sound,
  CreateSoundDto,
  UpdateSoundDto,
  PlaySource,
  StatsSummary
} from '@/types/sound';

const audioCache = new Map<string, HTMLAudioElement>();

export function useSounds() {
  const sounds = ref<Sound[]>([]);
  const stats = ref<StatsSummary | null>(null);
  const activeSoundId = ref<string | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  
  const audioStore = useAudioStore();
  const { effectiveVolume } = storeToRefs(audioStore);
  const toastStore = useToastStore();

  watch(effectiveVolume, (newVolume) => {
    audioCache.forEach((audio) => {
      audio.volume = newVolume;
    });
  });

  function extractError(err: unknown): string {
    if (axios.isAxiosError(err)) return err.response?.data?.message ?? err.message;
    return err instanceof Error ? err.message : 'Невідома помилка';
  }

  async function fetchSounds(category?: string, search?: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      sounds.value = await soundService.getSounds(category, search);
    } catch (err: unknown) {
      error.value = extractError(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchStats(): Promise<void> {
    try {
      stats.value = await soundService.getStatsSummary();
    } catch (err: unknown) {
      error.value = extractError(err);
    }
  }

  async function playSound(sound: Sound, source: PlaySource = 'click'): Promise<void> {
    activeSoundId.value = sound.id;
    try {
      let audio = audioCache.get(sound.id);
      if (!audio) {
        audio = new Audio(sound.audio_url);
        audioCache.set(sound.id, audio);
      }
      audio.currentTime = 0;
      audio.volume = effectiveVolume.value;
      audio.onended = () => {
        if (activeSoundId.value === sound.id) activeSoundId.value = null;
    };

      await audio.play();
    } catch {
      toastStore.addToast(`Помилка аудіо: ${sound.title}`, 'error');
    }

    try {
      const updated = await soundService.recordPlay(sound.id, source);
      sounds.value = sounds.value.map((item) => (item.id === updated.id ? updated : item));
      await fetchStats();
    } catch (err: unknown) {
      error.value = extractError(err);
    }
  }

  async function addSound(payload: CreateSoundDto): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    try {
      const created = await soundService.createSound(payload);
      sounds.value.push(created);
      toastStore.addToast('Звук додано', 'success');
      await fetchStats();
      return true;
    } catch (err: unknown) {
      error.value = extractError(err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSoundItem(id: string, payload: UpdateSoundDto): Promise<boolean> {
    error.value = null;
    try {
      const updated = await soundService.updateSound(id, payload);
      sounds.value = sounds.value.map((item) => (item.id === updated.id ? updated : item));
      toastStore.addToast('Звук оновлено', 'info');
      await fetchStats();
      return true;
    } catch (err: unknown) {
      error.value = extractError(err);
      return false;
    }
  }

  async function toggleFavorite(sound: Sound): Promise<void> {
    await updateSoundItem(sound.id, { is_favorite: !sound.is_favorite });
  }

  async function removeSound(id: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      await soundService.deleteSound(id);
      sounds.value = sounds.value.filter((item) => item.id !== id);
      toastStore.addToast('Звук видалено', 'info');
      await fetchStats();
    } catch (err: unknown) {
      error.value = extractError(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function triggerRandomSound(): Promise<void> {
    error.value = null;
    try {
      const randomSound = await soundService.getRandomSound();
      toastStore.addToast(`Рулетка: ${randomSound.title}`, 'info');
      await playSound(randomSound, 'random_mix');
    } catch (err: unknown) {
      error.value = extractError(err);
    }
  }

  return {
    sounds,
    stats,
    activeSoundId,
    isLoading,
    error,
    fetchSounds,
    fetchStats,
    playSound,
    addSound,
    updateSoundItem,
    toggleFavorite,
    removeSound,
    triggerRandomSound
  };
}