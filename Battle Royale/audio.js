// Web Audio API Procedural Sound Synthesizer for Battle Royale
let audioCtx = null;
let soundEnabled = true;

export function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function createNoiseBuffer() {
  if (!audioCtx) return null;
  const bufferSize = audioCtx.sampleRate * 0.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

let noiseBuffer = null;

export const sfx = {
  shootAR() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Punch oscillator
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // Mechanical crack noise
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
    if (noiseBuffer) {
      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const nGain = audioCtx.createGain();

      noise.buffer = noiseBuffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(2, now);

      nGain.gain.setValueAtTime(0.25, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(audioCtx.destination);
      noise.start(now);
      noise.stop(now + 0.1);
    }
  },

  shootShotgun() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Heavy bass boom
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    // Blast noise
    if (!noiseBuffer) noiseBuffer = createNoiseBuffer();
    if (noiseBuffer) {
      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const nGain = audioCtx.createGain();

      noise.buffer = noiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      nGain.gain.setValueAtTime(0.4, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(audioCtx.destination);
      noise.start(now);
      noise.stop(now + 0.22);
    }
  },

  hitmarker(isHeadshot = false, isShield = false) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (isHeadshot) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.setValueAtTime(2200, now + 0.04);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (isShield) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174, now + 0.03);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  },

  shieldBreak() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },

  chestHum() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  },

  openChest() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  },

  drinkPotion() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350 + i * 80, now + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(500 + i * 80, now + i * 0.12 + 0.08);

      gain.gain.setValueAtTime(0.12, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.09);
    }
  },

  gliderDeploy() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  },

  stormAlert() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  },

  victoryRoyale() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Victory fanfare chords: C, F, G, C
    const fanfare = [
      { notes: [261.63, 329.63, 392.00], time: 0, dur: 0.25 },     // C major
      { notes: [349.23, 440.00, 523.25], time: 0.28, dur: 0.25 },  // F major
      { notes: [392.00, 493.88, 587.33], time: 0.56, dur: 0.35 },  // G major
      { notes: [523.25, 659.25, 783.99, 1046.50], time: 0.95, dur: 1.2 } // High C major
    ];

    fanfare.forEach(chord => {
      chord.notes.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + chord.time);

        gain.gain.setValueAtTime(0.12, now + chord.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chord.time + chord.dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + chord.time);
        osc.stop(now + chord.time + chord.dur);
      });
    });
  },

  eliminated() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const notes = [330, 293, 261, 196]; // E, D, C, G
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + idx * 0.18 + 0.16);

      gain.gain.setValueAtTime(0.12, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.18);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.19);
    });
  }
};
