import { Audio } from 'expo-av';

const SOURCES = {
  cardFlip: require('../../assets/sfx/card-flip.wav'),
  turnWin: require('../../assets/sfx/turn-win.wav'),
  packOpen: require('../../assets/sfx/pack-open.wav'),
  matchWin: require('../../assets/sfx/match-win.wav'),
} as const;

export type SfxName = keyof typeof SOURCES;

const cache = new Map<SfxName, Audio.Sound>();
let muted = false;
let initialized = false;

async function ensureAudioMode() {
  if (initialized) return;
  initialized = true;
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => undefined);
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export async function playSfx(name: SfxName): Promise<void> {
  if (muted) return;
  try {
    await ensureAudioMode();
    let sound = cache.get(name);
    if (!sound) {
      const created = await Audio.Sound.createAsync(SOURCES[name]);
      sound = created.sound;
      cache.set(name, sound);
    }
    await sound.replayAsync();
  } catch {
    // Sound is a nice-to-have; never let playback errors break gameplay.
  }
}

export async function preloadSfx(): Promise<void> {
  await ensureAudioMode();
  await Promise.all(
    (Object.keys(SOURCES) as SfxName[]).map(async (name) => {
      if (cache.has(name)) return;
      try {
        const created = await Audio.Sound.createAsync(SOURCES[name]);
        cache.set(name, created.sound);
      } catch {
        // ignore preload failures per-sound
      }
    }),
  );
}
