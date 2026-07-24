// Generates small, original, procedurally-synthesized placeholder sound effects (no external
// or copyrighted audio) as 16-bit PCM mono WAV files for the game's basic SFX.
const fs = require('node:fs');
const path = require('node:path');

const SAMPLE_RATE = 22050;

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function envelope(t, duration, attack = 0.01, release = 0.08) {
  if (t < attack) return t / attack;
  const remaining = duration - t;
  if (remaining < release) return Math.max(0, remaining / release);
  return 1;
}

function tone(duration, freqFn, opts = {}) {
  const { gain = 0.5, noise = 0 } = opts;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = freqFn(t);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const wave = Math.sin(phase);
    const n2 = noise > 0 ? (Math.random() * 2 - 1) * noise : 0;
    samples[i] = (wave + n2) * gain * envelope(t, duration);
  }
  return samples;
}

function mix(...tracks) {
  const len = Math.max(...tracks.map((t) => t.length));
  const out = new Array(len).fill(0);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i++) out[i] += track[i];
  }
  return out;
}

const outDir = path.join(__dirname, '..', 'assets', 'sfx');
fs.mkdirSync(outDir, { recursive: true });

// Card flip: a quick upward-pitched flick.
writeWav(
  path.join(outDir, 'card-flip.wav'),
  tone(0.12, (t) => 500 + t * 2200, { gain: 0.4 }),
);

// Turn win: a bright two-note chime.
writeWav(
  path.join(outDir, 'turn-win.wav'),
  mix(
    tone(0.22, () => 880, { gain: 0.35 }),
    tone(0.28, () => 1320, { gain: 0.25 }).map((v, i) => (i / SAMPLE_RATE > 0.08 ? v : 0)),
  ),
);

// Pack opening: a rising shimmer sweep with light noise/sparkle.
writeWav(
  path.join(outDir, 'pack-open.wav'),
  tone(0.6, (t) => 220 + t * 900, { gain: 0.35, noise: 0.03 }),
);

// Match win: a triumphant three-note fanfare.
writeWav(
  path.join(outDir, 'match-win.wav'),
  mix(
    tone(0.9, () => 523.25, { gain: 0.3 }),
    tone(0.9, () => 659.25, { gain: 0.25 }),
    tone(0.9, () => 783.99, { gain: 0.25 }),
  ),
);

console.log('Generated SFX in', outDir);
