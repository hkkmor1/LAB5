import { baseApi } from '@/api/baseApi';
import type { Sound, CreateSoundDto, UpdateSoundDto, PlaySource, StatsSummary } from '@/types/sound';

class SoundService {
  public async getSounds(category?: string, search?: string): Promise<Sound[]> {
    const response = await baseApi.get<Sound[]>('/api/sounds', { params: { category, search } });
    return response.data;
  }

  public async getSoundById(id: string): Promise<Sound> {
    const response = await baseApi.get<Sound>(`/api/sounds/${id}`);
    return response.data;
  }

  public async createSound(payload: CreateSoundDto): Promise<Sound> {
    const response = await baseApi.post<Sound>('/api/sounds', payload);
    return response.data;
  }

  public async updateSound(id: string, payload: UpdateSoundDto): Promise<Sound> {
    const response = await baseApi.patch<Sound>(`/api/sounds/${id}`, payload);
    return response.data;
  }

  public async deleteSound(id: string): Promise<void> {
    await baseApi.delete(`/api/sounds/${id}`);
  }

  public async recordPlay(id: string, source: PlaySource): Promise<Sound> {
    const response = await baseApi.post<Sound>(`/api/sounds/${id}/play`, { source });
    return response.data;
  }

  public async getRandomSound(): Promise<Sound> {
    const response = await baseApi.post<Sound>('/api/sounds/random');
    return response.data;
  }

  public async getStatsSummary(): Promise<StatsSummary> {
    const response = await baseApi.get<StatsSummary>('/api/stats/summary');
    return response.data;
  }
}

export const soundService = new SoundService();