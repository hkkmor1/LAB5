export type SoundCategory = 'memes' | 'games' | 'reactions' | 'anime' | 'cinema';
export type DaisyColor = 'primary' | 'secondary' | 'accent' | 'warning' | 'error' | 'info';
export type PlaySource = 'click' | 'hotkey' | 'random_mix';

export interface Sound {
  id: string;
  title: string;
  category: SoundCategory;
  audio_url: string;
  hotkey: string | null;
  color: DaisyColor;
  play_count: number;
  is_favorite: boolean;
  created_at: string;
}

export interface SoundFilterParams {
  category?: string;
  search?: string;
}

export interface CreateSoundDto {
  title: string;
  category: SoundCategory;
  audio_url: string;
  hotkey: string | null;
  color: DaisyColor;
  is_favorite?: boolean;
}

export interface UpdateSoundDto {
  title?: string;
  category?: SoundCategory;
  audio_url?: string;
  hotkey?: string | null;
  color?: DaisyColor;
  is_favorite?: boolean;
}

export interface StatsSummary {
  total_plays: number;
  sound_of_the_day: Sound | null;
  top_category: SoundCategory | null;
}