import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import type { Ambience, SoundId } from '@/domain';

/* eslint-disable @typescript-eslint/no-require-imports -- les fichiers audio sont résolus par Metro */
const EFFECTS: Readonly<Record<SoundId, number>> = {
  done: require('../../assets/sounds/done.wav'),
  undo: require('../../assets/sounds/undo.wav'),
  fail: require('../../assets/sounds/fail.wav'),
  drink: require('../../assets/sounds/drink.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
  levelup: require('../../assets/sounds/levelup.wav'),
  bell: require('../../assets/sounds/bell.wav'),
};

const LOOPS: Readonly<Record<Exclude<Ambience, 'silence'>, number>> = {
  rain: require('../../assets/sounds/rain.wav'),
  ocean: require('../../assets/sounds/ocean.wav'),
  drone: require('../../assets/sounds/drone.wav'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

const FADE_IN_MS = 3000;
const FADE_OUT_MS = 1500;
const FADE_FAST_MS = 50;
const STEP_MS = 100;

type Releasable = AudioPlayer & { release?: () => void; remove?: () => void };

function dispose(player: AudioPlayer): void {
  try {
    player.pause();
    const p = player as Releasable;
    if (typeof p.release === 'function') p.release();
    else if (typeof p.remove === 'function') p.remove();
  } catch {
    /* déjà libéré */
  }
}

/**
 * Lecture des effets et des ambiances. Chaque appel est protégé : un problème audio
 * (appareil muet, fichier non chargé, navigateur qui bloque la lecture) ne doit jamais
 * faire planter l'application.
 */
class SoundPlayer {
  private readonly effects = new Map<SoundId, AudioPlayer>();
  private ambience: { player: AudioPlayer; timer: ReturnType<typeof setInterval> | null } | null = null;

  play(sound: SoundId): void {
    try {
      let player = this.effects.get(sound);
      if (!player) {
        player = createAudioPlayer(EFFECTS[sound]);
        this.effects.set(sound, player);
      }
      void player.seekTo(0);
      player.play();
    } catch {
      /* ignoré */
    }
  }

  /** Lance une ambiance en boucle, avec un fondu d'entrée de 3 s. `silence` n'en lance aucune. */
  startAmbience(ambience: Ambience): void {
    this.stopAmbience(true);
    if (ambience === 'silence') return;
    try {
      const player = createAudioPlayer(LOOPS[ambience]);
      player.loop = true;
      player.volume = 0;
      player.play();
      const entry: { player: AudioPlayer; timer: ReturnType<typeof setInterval> | null } = { player, timer: null };
      let elapsed = 0;
      entry.timer = setInterval(() => {
        elapsed += STEP_MS;
        try {
          player.volume = Math.min(1, elapsed / FADE_IN_MS);
        } catch {
          /* ignoré */
        }
        if (elapsed >= FADE_IN_MS && entry.timer) {
          clearInterval(entry.timer);
          entry.timer = null;
        }
      }, STEP_MS);
      this.ambience = entry;
    } catch {
      this.ambience = null;
    }
  }

  /** Arrête l'ambiance en fondu (1,5 s) ou presque tout de suite (`fast`). */
  stopAmbience(fast: boolean): void {
    const current = this.ambience;
    if (!current) return;
    this.ambience = null;
    if (current.timer) clearInterval(current.timer);
    const duration = fast ? FADE_FAST_MS : FADE_OUT_MS;
    let startVolume = 1;
    try {
      startVolume = current.player.volume;
    } catch {
      /* ignoré */
    }
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += STEP_MS;
      try {
        current.player.volume = Math.max(0, startVolume * (1 - elapsed / duration));
      } catch {
        /* ignoré */
      }
      if (elapsed >= duration) {
        clearInterval(timer);
        dispose(current.player);
      }
    }, Math.min(STEP_MS, duration));
  }
}

export const soundPlayer = new SoundPlayer();
