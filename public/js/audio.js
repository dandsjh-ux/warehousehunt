// Escape Warehouse – tiny synthesised sound effects + read-aloud (no audio files needed).
let ctx = null, master = null, soundOn = true, speakOn = true, ambientStarted = false;

export function unlock() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = soundOn ? 0.55 : 0;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
}
export function setSound(v) { soundOn = v; if (master) master.gain.value = v ? 0.55 : 0; }
export function setSpeak(v) { speakOn = v; if (!v && 'speechSynthesis' in window) speechSynthesis.cancel(); }

function tone(f, d = 0.15, type = 'sine', vol = 0.3, f2 = null, delay = 0) {
  if (!ctx || !soundOn) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + d + 0.05);
}
function noise(d = 0.07, vol = 0.1, freq = 600) {
  if (!ctx || !soundOn) return;
  const len = Math.floor(ctx.sampleRate * d);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master); src.start();
}

export const pickup = () => { tone(660, 0.12, 'triangle', 0.3); tone(990, 0.2, 'triangle', 0.3, null, 0.08); };
export const wrong = () => { tone(200, 0.28, 'sawtooth', 0.12, 120); };
export const ping = () => { tone(1500, 0.7, 'sine', 0.22, 600); tone(1500, 0.7, 'sine', 0.1, 600, 0.3); };
export const tag = () => { tone(520, 0.45, 'square', 0.14, 110); };
export const escape = () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.25, null, i * 0.09)); };
export const complete = () => { [784, 988, 1175].forEach((f, i) => tone(f, 0.25, 'sine', 0.25, null, i * 0.11)); };
export const rescue = () => { [392, 523, 659].forEach((f, i) => tone(f, 0.2, 'square', 0.12, null, i * 0.1)); };
export const tick = () => tone(880, 0.05, 'square', 0.06);
export const go = () => { tone(440, 0.15, 'square', 0.15); tone(880, 0.4, 'square', 0.15, null, 0.15); };
export const locker = () => { noise(0.18, 0.25, 300); tone(140, 0.12, 'square', 0.06); };
export const step = (soft) => noise(0.05, soft ? 0.03 : 0.07, 450);
export const click = () => tone(1200, 0.04, 'square', 0.05);
export const zap = () => { noise(0.25, 0.3, 2400); tone(900, 0.25, 'sawtooth', 0.12, 2400); };
export const alarm = () => { [0, 0.28].forEach(d => { tone(988, 0.22, 'square', 0.14, 740, d); }); };
export const slip = () => { tone(500, 0.5, 'sine', 0.25, 90); };
export const coin = () => { tone(1320, 0.08, 'square', 0.1); tone(1760, 0.18, 'square', 0.1, null, 0.08); };
export const heartbeat = () => { tone(70, 0.12, 'sine', 0.55, 50); tone(62, 0.14, 'sine', 0.4, 45, 0.17); };

export function startAmbient() {
  if (!ctx || ambientStarted) return;
  ambientStarted = true;
  const g = ctx.createGain(); g.gain.value = 0.045;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
  for (const fr of [55, 55.6, 82.4]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); }
  f.connect(g); g.connect(master);
}

let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  return vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };

export function speak(text, rate = 0.9) {
  if (!speakOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate; u.pitch = 1.05;
    voice = voice || pickVoice();
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
