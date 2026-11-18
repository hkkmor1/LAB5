import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', () => {
  const volume = ref<number>(0.8);
  const isMuted = ref<boolean>(false);

  const effectiveVolume = computed<number>(() => (isMuted.value ? 0 : volume.value));

  function toggleMute(): void {
    isMuted.value = !isMuted.value;
  }

  function setVolume(val: number): void {
    volume.value = Math.min(1, Math.max(0, val));
    if (volume.value > 0 && isMuted.value) {
      isMuted.value = false;
    }
  }

  return {
    volume,
    isMuted,
    effectiveVolume,
    toggleMute,
    setVolume
  };
});