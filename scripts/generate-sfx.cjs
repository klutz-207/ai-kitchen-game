const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const outDir = path.join(__dirname, '..', 'assets', 'audio');

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function midi(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function seededNoise(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

function wave(type, phase) {
  const p = phase % 1;
  if (type === 'square') return p < 0.5 ? 1 : -1;
  if (type === 'tri') return 1 - 4 * Math.abs(Math.round(p - 0.25) - (p - 0.25));
  if (type === 'saw') return 2 * p - 1;
  return Math.sin(phase * Math.PI * 2);
}

function env(t, start, duration, attack = 0.01, release = 0.08) {
  const local = t - start;
  if (local < 0 || local > duration) return 0;
  if (local < attack) return local / attack;
  if (local > duration - release) return Math.max(0, (duration - local) / release);
  return 1;
}

function render(duration, events, gain = 0.8) {
  const length = Math.max(1, Math.floor(duration * sampleRate));
  const data = new Float32Array(length);
  const noise = seededNoise(20260517);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    for (const e of events) {
      const amp = env(t, e.start || 0, e.duration, e.attack ?? 0.008, e.release ?? 0.06) * (e.gain ?? 1);
      if (amp <= 0) continue;

      const local = t - (e.start || 0);
      const sweep = e.to ? e.freq + (e.to - e.freq) * (local / e.duration) : e.freq;
      const vib = e.vibrato ? Math.sin(t * e.vibrato.rate * Math.PI * 2) * e.vibrato.depth : 0;
      const freq = Math.max(20, sweep + vib);

      if (e.type === 'noise') {
        sample += noise() * amp;
      } else if (e.type === 'click') {
        sample += (local < 0.004 ? 1 - local / 0.004 : 0) * amp;
      } else {
        sample += wave(e.type || 'sine', t * freq) * amp;
      }
    }

    data[i] = clamp(sample * gain);
  }

  return data;
}

function encodeWav(samples) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  }

  return buffer;
}

function save(name, duration, events, description, gain = 0.72) {
  const file = `${name}.wav`;
  fs.writeFileSync(path.join(outDir, file), encodeWav(render(duration, events, gain)));
  return { file, duration, description };
}

function sparkle(start, notes, gain = 0.32) {
  return notes.map((note, index) => ({
    type: 'tri',
    freq: midi(note),
    start: start + index * 0.055,
    duration: 0.22,
    attack: 0.004,
    release: 0.16,
    gain,
  }));
}

function chord(start, notes, duration, gain = 0.2) {
  return notes.map((note) => ({
    type: 'sine',
    freq: midi(note),
    start,
    duration,
    attack: 0.025,
    release: duration * 0.45,
    gain,
  }));
}

fs.mkdirSync(outDir, { recursive: true });

const assets = [];

assets.push(save('amb_kitchen_loop', 12, [
  ...Array.from({ length: 14 }, (_, i) => ({ type: 'sine', freq: 170 + (i % 4) * 34, start: 0.5 + i * 0.78, duration: 0.16, attack: 0.012, release: 0.11, gain: 0.04 })),
  ...Array.from({ length: 7 }, (_, i) => ({ type: 'tri', freq: midi([72, 76, 79][i % 3]), start: 1.1 + i * 1.45, duration: 0.12, attack: 0.004, release: 0.08, gain: 0.035 })),
  ...Array.from({ length: 6 }, (_, i) => ({ type: 'click', start: 1.4 + i * 1.7, duration: 0.02, gain: 0.025 })),
], 'Loopable warm kitchen ambience: stove, bubbles, soft room tone.', 0.52));

assets.push(save('sfx_ui_hover', 0.22, [
  { type: 'click', start: 0, duration: 0.03, gain: 0.35 },
  { type: 'tri', freq: midi(76), start: 0.02, duration: 0.16, release: 0.12, gain: 0.24 },
], 'Tiny warm UI hover tick.'));

assets.push(save('sfx_chef_select', 0.5, [
  { type: 'click', start: 0, duration: 0.04, gain: 0.3 },
  ...sparkle(0.04, [72, 76, 79], 0.28),
  ...chord(0.08, [60, 67], 0.35, 0.11),
], 'Positive chef selection chime.'));

assets.push(save('sfx_service_start', 0.95, [
  { type: 'tri', freq: midi(81), start: 0, duration: 0.34, release: 0.24, gain: 0.38 },
  { type: 'noise', start: 0.12, duration: 0.18, attack: 0.005, release: 0.13, gain: 0.045 },
  ...sparkle(0.28, [76, 79, 83, 88], 0.24),
], 'Counter bell and stove whoosh for starting service.'));

assets.push(save('sfx_guest_arrival', 1.35, [
  { type: 'tri', freq: midi(72), start: 0.02, duration: 0.36, release: 0.22, gain: 0.24 },
  { type: 'click', start: 0.46, duration: 0.04, gain: 0.25 },
  { type: 'click', start: 0.72, duration: 0.04, gain: 0.22 },
  { type: 'noise', start: 0.62, duration: 0.45, attack: 0.02, release: 0.28, gain: 0.08 },
  ...chord(0.78, [57, 64, 69], 0.48, 0.09),
], 'Guest enters with door chime and soft steps.'));

assets.push(save('sfx_speech_bubble', 0.42, [
  { type: 'sine', freq: 260, to: 390, start: 0, duration: 0.18, release: 0.09, gain: 0.26 },
  { type: 'noise', start: 0.03, duration: 0.18, release: 0.13, gain: 0.08 },
  { type: 'tri', freq: midi(76), start: 0.18, duration: 0.16, gain: 0.16 },
], 'Soft bubble pop for dialogue.'));

assets.push(save('sfx_type_tick', 0.09, [
  { type: 'click', start: 0, duration: 0.02, gain: 0.2 },
  { type: 'square', freq: midi(84), start: 0.006, duration: 0.055, attack: 0.001, release: 0.035, gain: 0.08 },
], 'Single subtle typewriter tick.', 0.55));

assets.push(save('sfx_understand', 0.78, [
  ...chord(0, [62, 69, 74], 0.46, 0.14),
  { type: 'noise', start: 0.12, duration: 0.35, release: 0.28, gain: 0.07 },
  ...sparkle(0.25, [74, 78, 81], 0.22),
], 'Warm button cue for understanding the guest.'));

assets.push(save('sfx_thinking_dots_loop', 1.0, [
  { type: 'sine', freq: midi(67), start: 0.08, duration: 0.16, release: 0.11, gain: 0.2 },
  { type: 'sine', freq: midi(69), start: 0.38, duration: 0.16, release: 0.11, gain: 0.2 },
  { type: 'sine', freq: midi(72), start: 0.68, duration: 0.16, release: 0.11, gain: 0.2 },
], 'Loopable three-dot thinking blips.'));

assets.push(save('sfx_bubble_expand', 2.2, [
  { type: 'noise', start: 0.05, duration: 0.42, attack: 0.02, release: 0.3, gain: 0.035 },
  { type: 'sine', freq: 160, to: 420, start: 0.08, duration: 1.3, attack: 0.04, release: 0.65, gain: 0.16 },
  ...sparkle(0.75, [76, 79, 83, 86, 91], 0.18),
  ...chord(1.15, [60, 67, 72], 0.82, 0.09),
], 'Thought bubble expanding into creation space.'));

assets.push(save('sfx_creation_reveal', 0.85, [
  { type: 'noise', start: 0, duration: 0.35, attack: 0.02, release: 0.28, gain: 0.07 },
  ...chord(0.08, [65, 72, 77], 0.62, 0.11),
  ...sparkle(0.33, [77, 81], 0.18),
], 'Creative white-space reveal.'));

assets.push(save('sfx_input_focus', 0.22, [
  { type: 'click', start: 0, duration: 0.02, gain: 0.16 },
  { type: 'sine', freq: midi(79), start: 0.02, duration: 0.13, release: 0.08, gain: 0.13 },
], 'Tiny input focus cue.', 0.56));

assets.push(save('sfx_send_idea', 0.62, [
  { type: 'noise', start: 0, duration: 0.18, attack: 0.005, release: 0.14, gain: 0.08 },
  { type: 'sine', freq: 190, to: 120, start: 0.13, duration: 0.2, release: 0.12, gain: 0.24 },
  ...sparkle(0.26, [72, 76, 79], 0.18),
], 'Paper note and ingredient drop into the pot.'));

assets.push(save('sfx_ai_guide', 0.66, [
  { type: 'tri', freq: midi(69), start: 0.04, duration: 0.22, release: 0.14, gain: 0.18 },
  ...sparkle(0.16, [72, 74, 77], 0.16),
  ...chord(0.25, [60, 64], 0.34, 0.08),
], 'AI guide response appears.'));

assets.push(save('sfx_cooking_start', 1.15, [
  { type: 'noise', start: 0, duration: 0.18, attack: 0.005, release: 0.13, gain: 0.05 },
  { type: 'sine', freq: 90, to: 150, start: 0.05, duration: 0.35, release: 0.24, gain: 0.2 },
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'sine', freq: 180 + i * 35, start: 0.38 + i * 0.09, duration: 0.16, release: 0.11, gain: 0.09 })),
  ...sparkle(0.58, [76, 79, 83], 0.16),
], 'Stove ignition and magical cooking start.'));

assets.push(save('sfx_cooking_loader_loop', 4, [
  ...Array.from({ length: 10 }, (_, i) => ({ type: 'sine', freq: 160 + (i % 3) * 38, start: 0.2 + i * 0.36, duration: 0.14, release: 0.1, gain: 0.07 })),
  ...Array.from({ length: 7 }, (_, i) => ({ type: 'tri', freq: midi([72, 76, 79, 83][i % 4]), start: 0.42 + i * 0.48, duration: 0.12, release: 0.09, gain: 0.06 })),
], 'Loopable magical cooking loader.'));

assets.push(save('sfx_dish_reveal', 1.0, [
  { type: 'noise', start: 0, duration: 0.16, release: 0.13, gain: 0.08 },
  { type: 'click', start: 0.08, duration: 0.04, gain: 0.22 },
  ...sparkle(0.14, [72, 76, 79, 84], 0.25),
  ...chord(0.3, [60, 67, 72], 0.5, 0.1),
], 'Dish appears on a ceramic plate.'));

assets.push(save('sfx_page_flip', 0.72, [
  { type: 'noise', start: 0, duration: 0.34, attack: 0.01, release: 0.24, gain: 0.11 },
  { type: 'tri', freq: midi(74), start: 0.24, duration: 0.2, release: 0.12, gain: 0.18 },
], 'Recipe page turns to the second dish.'));

assets.push(save('sfx_fusion_button', 0.68, [
  { type: 'sine', freq: 180, to: 280, start: 0, duration: 0.18, release: 0.12, gain: 0.16 },
  ...sparkle(0.12, [76, 79, 83], 0.24),
  { type: 'tri', freq: midi(72), start: 0.34, duration: 0.2, release: 0.13, gain: 0.18 },
], 'Fusion button bounce and sparkle.'));

assets.push(save('sfx_fusion_start', 1.45, [
  { type: 'noise', start: 0.05, duration: 0.24, attack: 0.01, release: 0.18, gain: 0.04 },
  { type: 'sine', freq: 120, to: 360, start: 0.05, duration: 1.05, attack: 0.02, release: 0.35, gain: 0.2 },
  ...sparkle(0.48, [72, 76, 79, 83, 88], 0.18),
], 'Two dishes pulled into magical fusion.'));

assets.push(save('sfx_fusion_orbit_loop', 2, [
  ...Array.from({ length: 7 }, (_, i) => ({ type: 'sine', freq: 240 + i * 28, start: i * 0.26, duration: 0.16, release: 0.12, gain: 0.08 })),
  ...Array.from({ length: 5 }, (_, i) => ({ type: 'tri', freq: midi([72, 76, 79, 83, 86][i]), start: 0.15 + i * 0.34, duration: 0.15, release: 0.1, gain: 0.08 })),
], 'Loopable swirling plate orbit for fusion animation.'));

assets.push(save('sfx_fusion_burst', 2.0, [
  { type: 'noise', start: 0.05, duration: 0.18, attack: 0.005, release: 0.13, gain: 0.055 },
  { type: 'sine', freq: 120, to: 90, start: 0.02, duration: 0.35, attack: 0.005, release: 0.25, gain: 0.17 },
  ...sparkle(0.16, [72, 76, 79, 83, 88, 91, 95], 0.28),
  ...chord(0.55, [60, 67, 72, 76], 1.0, 0.13),
], 'Bright final dish fusion burst.'));

assets.push(save('sfx_serve_dish', 0.82, [
  { type: 'noise', start: 0, duration: 0.18, release: 0.12, gain: 0.06 },
  { type: 'click', start: 0.16, duration: 0.04, gain: 0.32 },
  { type: 'tri', freq: midi(74), start: 0.22, duration: 0.26, release: 0.17, gain: 0.16 },
], 'Plate placed gently on the counter.'));

assets.push(save('sfx_guest_thinking', 0.9, [
  { type: 'click', start: 0.05, duration: 0.03, gain: 0.16 },
  { type: 'sine', freq: midi(67), start: 0.18, duration: 0.18, release: 0.12, gain: 0.14 },
  { type: 'sine', freq: midi(70), start: 0.47, duration: 0.18, release: 0.12, gain: 0.14 },
], 'Guest tasting and thinking cue.'));

assets.push(save('sfx_satisfied', 1.45, [
  ...chord(0.02, [60, 67, 72], 0.78, 0.13),
  ...sparkle(0.38, [76, 79, 83, 88], 0.18),
  { type: 'noise', start: 0.55, duration: 0.36, attack: 0.04, release: 0.28, gain: 0.05 },
], 'Tender satisfied emotional response.'));

assets.push(save('sfx_score_pop', 0.78, [
  { type: 'tri', freq: midi(72), start: 0.05, duration: 0.14, release: 0.09, gain: 0.2 },
  { type: 'tri', freq: midi(76), start: 0.24, duration: 0.14, release: 0.09, gain: 0.2 },
  { type: 'tri', freq: midi(79), start: 0.43, duration: 0.18, release: 0.11, gain: 0.23 },
], 'Three ascending score bar pops.'));

assets.push(save('sfx_rarity_reveal', 1.18, [
  ...sparkle(0.02, [79, 83, 86, 91, 95], 0.26),
  ...chord(0.36, [62, 69, 74, 78], 0.64, 0.11),
], 'Rare rating reveal flourish.'));

assets.push(save('sfx_settlement_slide', 0.82, [
  { type: 'noise', start: 0, duration: 0.24, attack: 0.01, release: 0.18, gain: 0.08 },
  { type: 'tri', freq: midi(72), start: 0.2, duration: 0.22, release: 0.15, gain: 0.17 },
  { type: 'tri', freq: midi(79), start: 0.42, duration: 0.2, release: 0.14, gain: 0.16 },
], 'Receipt card slides up and settles.'));

assets.push(save('sfx_next_guest', 0.88, [
  { type: 'tri', freq: midi(79), start: 0, duration: 0.22, release: 0.14, gain: 0.24 },
  { type: 'noise', start: 0.18, duration: 0.2, release: 0.16, gain: 0.07 },
  ...sparkle(0.34, [72, 76], 0.16),
], 'Next guest transition bell and page flip.'));

assets.push(save('sfx_error_soft', 0.58, [
  { type: 'sine', freq: midi(64), to: midi(59), start: 0, duration: 0.32, release: 0.2, gain: 0.22 },
  { type: 'noise', start: 0.08, duration: 0.14, release: 0.1, gain: 0.06 },
], 'Friendly soft error sputter.'));

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sampleRate,
    format: 'wav, mono, 16-bit PCM',
    assets,
  }, null, 2)}\n`,
);

console.log(`Generated ${assets.length} audio files in ${outDir}`);
