<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import {
  Volume2,
  Star,
  Keyboard,
  Trash2,
  Edit3,
  Radio
} from 'lucide-vue-next';
import type { Sound, DaisyColor, PlaySource } from '@/types/sound';

const props = defineProps<{
  sounds: Sound[];
  activeSoundId: string | null;
}>();

const emit = defineEmits<{
  play: [sound: Sound, source: PlaySource];
  toggleFavorite: [sound: Sound];
  edit: [sound: Sound];
  delete: [id: string];
}>();

const borderClassMap: Record<DaisyColor, string> = {
  primary: 'border-primary hover:border-primary',
  secondary: 'border-secondary hover:border-secondary',
  accent: 'border-accent hover:border-accent',
  warning: 'border-warning hover:border-warning',
  error: 'border-error hover:border-error',
  info: 'border-info hover:border-info'
};

const buttonClassMap: Record<DaisyColor, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  warning: 'btn-warning',
  error: 'btn-error',
  info: 'btn-info'
};

const badgeClassMap: Record<DaisyColor, string> = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  accent: 'badge-accent',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info'
};

function formatHotkeyLabel(hotkey: string | null): string {
  if (!hotkey) return 'Немає';
  if (hotkey.startsWith('Key')) return `[ ${hotkey.replace('Key', '')} ]`;
  if (hotkey.startsWith('Digit')) return `[ ${hotkey.replace('Digit', '')} ]`;
  if (hotkey === 'Space') return '[ SPACE ]';
  return `[ ${hotkey.toUpperCase()} ]`;
}

function handleKeyDown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
    return;
  }

  const matchedSound = props.sounds.find(
    (item) =>
      item.hotkey !== null &&
      (item.hotkey.toLowerCase() === event.code.toLowerCase() || item.hotkey.toLowerCase() === event.key.toLowerCase())
  );

  if (matchedSound) {
    event.preventDefault();
    emit('play', matchedSound, 'hotkey');
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<template>
  <div>
    <div v-if="props.sounds.length === 0" class="alert alert-info shadow-md flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Radio class="w-6 h-6 shrink-0" />
        <span>Бібліотека звуків порожня. Натисніть «Додати звук», щоб поповнити колекцію!</span>
      </div>
    </div>

    <TransitionGroup
      v-else
      name="list"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
    >
      <div
        v-for="sound in props.sounds"
        :key="sound.id"
        class="card bg-base-200 border-2 shadow-lg transition-all duration-200 select-none"
        :class="[
          borderClassMap[sound.color],
          props.activeSoundId === sound.id ? 'scale-95 ring-4 ring-offset-2 ring-primary bg-base-300' : 'hover:-translate-y-1 hover:shadow-xl'
        ]"
      >
        <div class="card-body p-5 flex flex-col justify-between gap-4">
          <div class="flex items-center justify-between gap-2">
            <span class="badge badge-outline uppercase text-xs font-semibold">{{ sound.category }}</span>
            <div class="flex items-center gap-1">
              <span class="badge badge-sm font-mono gap-1" :class="sound.hotkey ? badgeClassMap[sound.color] : 'badge-ghost'">
                <Keyboard class="w-3 h-3" />
                {{ formatHotkeyLabel(sound.hotkey) }}
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                :class="sound.is_favorite ? 'text-warning' : 'text-base-content/40'"
                @click.stop="emit('toggleFavorite', sound)"
              >
                <Star class="w-4 h-4" :fill="sound.is_favorite ? 'currentColor' : 'none'" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-lg w-full h-24 flex flex-col items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
            :class="[buttonClassMap[sound.color], props.activeSoundId === sound.id ? 'animate-pulse' : '']"
            @click="emit('play', sound, 'click')"
          >
            <Volume2 class="w-7 h-7" :class="props.activeSoundId === sound.id ? 'animate-bounce' : ''" />
            <span class="font-bold text-base line-clamp-1">{{ sound.title }}</span>
          </button>

          <div class="flex items-center justify-between pt-1 border-t border-base-300 text-xs">
            <span class="badge badge-neutral gap-1 font-medium">Прослуховувань: {{ sound.play_count }}</span>
            <div class="flex items-center gap-1">
              <button type="button" class="btn btn-ghost btn-xs" @click.stop="emit('edit', sound)">
                <Edit3 class="w-4 h-4" />
              </button>
              <button type="button" class="btn btn-ghost btn-xs text-error" @click.stop="emit('delete', sound.id)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>