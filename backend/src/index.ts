import express, { type Request, type Response } from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

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

export interface PlayHistoryEntry {
  id: string;
  sound_id: string;
  timestamp: string;
  source: PlaySource;
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'src/data');
const SOUNDS_FILE_PATH = path.join(DATA_DIR, 'sounds.json');
const HISTORY_FILE_PATH = path.join(DATA_DIR, 'play_history.json');

async function initializeDataFiles(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  try {
    await fs.access(SOUNDS_FILE_PATH);
  } catch {
    await fs.writeFile(SOUNDS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  }

  try {
    await fs.access(HISTORY_FILE_PATH);
  } catch {
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

async function readSounds(): Promise<Sound[]> {
  const rawData = await fs.readFile(SOUNDS_FILE_PATH, 'utf-8');
  return JSON.parse(rawData) as Sound[];
}

async function writeSounds(sounds: Sound[]): Promise<void> {
  await fs.writeFile(SOUNDS_FILE_PATH, JSON.stringify(sounds, null, 2), 'utf-8');
}

async function readHistory(): Promise<PlayHistoryEntry[]> {
  const rawData = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
  return JSON.parse(rawData) as PlayHistoryEntry[];
}

async function writeHistory(history: PlayHistoryEntry[]): Promise<void> {
  await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');
}

app.get('/api/sounds', async (req: Request, res: Response) => {
  try {
    const sounds = await readSounds();
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const filtered = sounds.filter((s) => {
      const matchCat = !category || category === 'all' || s.category === category;
      const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    res.status(200).json(filtered);
  } catch {
    res.status(500).json({ message: 'Помилка читання каталогу' });
  }
});

app.post('/api/sounds', async (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<Sound>;
    if (!body.title || !body.audio_url) {
      res.status(400).json({ message: 'Назва та URL обов\'язкові' });
      return;
    }

    const sounds = await readSounds();
    const hotkey = body.hotkey?.trim() || null;

    if (hotkey && sounds.some((s) => s.hotkey?.toLowerCase() === hotkey.toLowerCase())) {
      res.status(409).json({ message: `Клавіша ${hotkey} вже зайнята` });
      return;
    }

    const newSound: Sound = {
      id: crypto.randomUUID(),
      title: body.title.trim(),
      category: body.category ?? 'memes',
      audio_url: body.audio_url.trim(),
      hotkey,
      color: body.color ?? 'primary',
      play_count: 0,
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    sounds.push(newSound);
    await writeSounds(sounds);
    res.status(201).json(newSound);
  } catch {
    res.status(500).json({ message: 'Помилка збереження' });
  }
});

app.get('/api/sounds/:id', async (req: Request, res: Response) => {
  try {
    const sounds = await readSounds();
    const sound = sounds.find((s) => s.id === req.params.id);
    
    if (!sound) {
      res.status(404).json({ message: 'Звук не знайдено' });
      return;
    }
    
    res.status(200).json(sound);
  } catch {
    res.status(500).json({ message: 'Помилка отримання звуку' });
  }
});

app.patch('/api/sounds/:id', async (req: Request, res: Response) => {
  try {
    const sounds = await readSounds();
    const index = sounds.findIndex((s) => s.id === req.params.id);
    
    if (index === -1) {
      res.status(404).json({ message: 'Звук не знайдено' });
      return;
    }

    const body = req.body as Partial<Sound>;

    if (body.hotkey !== undefined) {
      const newHotkey = body.hotkey?.trim() || null;
      if (
        newHotkey && 
        sounds.some((s) => s.id !== req.params.id && s.hotkey?.toLowerCase() === newHotkey.toLowerCase())
      ) {
        res.status(409).json({ message: `Клавіша ${newHotkey} вже зайнята` });
        return;
      }
      sounds[index].hotkey = newHotkey;
    }

    if (body.title !== undefined) sounds[index].title = body.title.trim();
    if (body.category !== undefined) sounds[index].category = body.category;
    if (body.audio_url !== undefined) sounds[index].audio_url = body.audio_url.trim();
    if (body.color !== undefined) sounds[index].color = body.color;
    if (body.is_favorite !== undefined) sounds[index].is_favorite = body.is_favorite;

    await writeSounds(sounds);
    res.status(200).json(sounds[index]);
  } catch {
    res.status(500).json({ message: 'Помилка оновлення звуку' });
  }
});

app.delete('/api/sounds/:id', async (req: Request, res: Response) => {
  try {
    const sounds = await readSounds();
    const exists = sounds.some((s) => s.id === req.params.id);
    if (!exists) {
      res.status(404).json({ message: 'Звук не знайдено' });
      return;
    }
    
    await writeSounds(sounds.filter((s) => s.id !== req.params.id));
    const history = await readHistory();
    await writeHistory(history.filter((h) => h.sound_id !== req.params.id));
    
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Помилка видалення' });
  }
});

app.post('/api/sounds/:id/play', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sounds = await readSounds();
    const index = sounds.findIndex((s) => s.id === req.params.id);
    
    if (index === -1) {
      res.status(404).json({ message: 'Звук не знайдено' });
      return;
    }

    sounds[index].play_count += 1;
    await writeSounds(sounds);

    const history = await readHistory();
    history.push({
      id: crypto.randomUUID(),
      sound_id: req.params.id,
      timestamp: new Date().toISOString(),
      source: (req.body.source as PlaySource) || 'click'
    });
    await writeHistory(history);

    res.status(200).json(sounds[index]);
  } catch {
    res.status(500).json({ message: 'Помилка фіксації відтворення' });
  }
});

app.post('/api/sounds/random', async (_req: Request, res: Response) => {
  try {
    const sounds = await readSounds();
    if (sounds.length === 0) {
      res.status(404).json({ message: 'Бібліотека порожня' });
      return;
    }

    const randomIndex = Math.floor(Math.random() * sounds.length);
    res.status(200).json(sounds[randomIndex]);
  } catch {
    res.status(500).json({ message: 'Помилка випадкового вибору' });
  }
});

app.get('/api/stats/summary', async (_req: Request, res: Response) => {
  try {
    const sounds = await readSounds();
    const history = await readHistory();

    const totalPlays = sounds.reduce((sum, item) => sum + item.play_count, 0);

    const oneDayAgoMs = Date.now() - 24 * 60 * 60 * 1000;
    const recentCounts = new Map<string, number>();

    for (const entry of history) {
      const entryTime = new Date(entry.timestamp).getTime();
      if (entryTime >= oneDayAgoMs) {
        recentCounts.set(entry.sound_id, (recentCounts.get(entry.sound_id) ?? 0) + 1);
      }
    }

    let soundOfTheDay: Sound | null = null;

    if (recentCounts.size > 0) {
      let topSoundId = '';
      let maxRecentPlays = -1;
      for (const [soundId, count] of recentCounts.entries()) {
        if (count > maxRecentPlays) {
          maxRecentPlays = count;
          topSoundId = soundId;
        }
      }
      soundOfTheDay = sounds.find((item) => item.id === topSoundId) ?? null;
    }

    if (!soundOfTheDay && sounds.length > 0) {
      soundOfTheDay = [...sounds].sort((a, b) => b.play_count - a.play_count)[0] ?? null;
    }

    const categoryTotals = new Map<SoundCategory, number>();
    for (const sound of sounds) {
      const currentCount = categoryTotals.get(sound.category) ?? 0;
      categoryTotals.set(sound.category, currentCount + sound.play_count);
    }

    let topCategory: SoundCategory | null = null;
    let maxCategoryPlays = -1;
    for (const [category, count] of categoryTotals.entries()) {
      if (count > maxCategoryPlays) {
        maxCategoryPlays = count;
        topCategory = category;
      }
    }

    res.status(200).json({
      total_plays: totalPlays,
      sound_of_the_day: soundOfTheDay,
      top_category: topCategory
    });
  } catch {
    res.status(500).json({ message: 'Помилка формування аналітики' });
  }
});

initializeDataFiles().then(() => {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  
});