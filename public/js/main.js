// Escape Warehouse – browser client
import * as THREE from 'three';
import * as M from '../shared/map.js';
import { TYPES, LEVELS } from '../shared/words.js';
import { SHOP, SETTINGS_SCHEMA, LOOK_OPTIONS, SKIN_TONES, HAIR_COLOURS, CLOTH_COLOURS, DEFAULT_LOOK, sanitizeLook } from '../shared/settings.js';
import { buildWorld } from './world.js';
import { buildCharacter, animateCharacter } from './character.js';
import * as SFX from './audio.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
function lerpAngle(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; }
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- preferences (saved on this device) ----------
const PREFS_KEY = 'escapeWarehouse.v1';
const prefs = { name: '', look: { ...DEFAULT_LOOK }, sound: true, speak: true, quality: isTouch ? 'low' : 'high', brightness: 1, sens: 1 };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { /* private mode */ }
prefs.look = sanitizeLook(prefs.look);
const savePrefs = () => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } };
SFX.setSound(prefs.sound); SFX.setSpeak(prefs.speak);

// wait briefly for fonts so 3D signs use them
try { await Promise.race([Promise.all([document.fonts.load('40px "Bungee"'), document.fonts.load('900 40px "Nunito"')]), new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* ignore */ }

// ---------- three.js setup ----------
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: prefs.quality === 'high', powerPreference: 'high-performance' });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, 1, 0.08, 160);
const world = buildWorld(scene);
world.setDarkness('dark', prefs.brightness);
world.setTableWords(M.TABLES.map(t => ({ article: 'the', noun: 'noun', verb: 'verb', adjective: 'adjective' }[t.room])));

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, prefs.quality === 'high' ? 1.75 : 1));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// local torch (only the local player's torch is a real light – others are glowing beams)
const torch = new THREE.SpotLight(0xfff1d6, 0, 24, 0.6, 0.55, 1.3);
scene.add(torch, torch.target);

const beamGeo = new THREE.ConeGeometry(1.5, 7, 18, 1, true).translate(0, -3.5, 0).rotateX(-Math.PI / 2);
const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const ringGeo = new THREE.RingGeometry(0.42, 0.6, 28).rotateX(-Math.PI / 2);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.85, depthWrite: false });
const pillarGeo = new THREE.CylinderGeometry(0.45, 0.45, 16, 14, 1, true);
function makeRing() { const r = new THREE.Mesh(ringGeo, ringMat); r.position.y = 0.04; r.visible = false; return r; }

// ---------- socket ----------
const socket = io({ transports: ['websocket', 'polling'] });
let myId = null;
let screen = 'menu';
let LOBBY = null;
let G = null;              // current round state
let pendingRejoin = false;
const remotes = new Map(); // other players

// ---------- local player ----------
const P = { x: M.EXIT_POINT.x, y: 0, z: M.EXIT_POINT.z + 2, ry: 0, crouch: false, run: false, torch: true, stamina: 1, tired: false, hidden: null, hideUntil: 0, stepT: 0, speedN: 0 };
let myMesh = null, myRing = null;
function rebuildMyMesh() {
  if (myMesh) scene.remove(myMesh);
  myMesh = buildCharacter(prefs.look);
  myRing = makeRing(); myMesh.add(myRing);
  myMesh.visible = false;
  scene.add(myMesh);
}
rebuildMyMesh();

let camYaw = Math.PI, camPitch = 0.3, camDist = 3.6, camCur = 3.6;
const myLevel = () => M.levelOfY(P.y);

// ============================================================
// MENU: character customiser
// ============================================================
const pv = { renderer: null, scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(28, 200 / 290, 0.1, 20), model: null };
function initPreview() {
  pv.renderer = new THREE.WebGLRenderer({ canvas: $('#preview'), antialias: true, alpha: true });
  pv.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  pv.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x404060, 2.4));
  const dl = new THREE.DirectionalLight(0xffd9a0, 2.2); dl.position.set(2, 3, 4); pv.scene.add(dl);
  pv.cam.position.set(0, 1.05, 4.6); pv.cam.lookAt(0, 0.88, 0);
  updatePreview();
}
function updatePreview() {
  if (pv.model) pv.scene.remove(pv.model);
  pv.model = buildCharacter(prefs.look);
  pv.model.rotation.y = 0.5;
  pv.scene.add(pv.model);
}
function renderPreview(dt) {
  if (!pv.renderer || !pv.model) return;
  const c = pv.renderer.domElement;
  if (!c.offsetParent) return;
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.floor(w * pv.renderer.getPixelRatio())) { pv.renderer.setSize(w, h, false); pv.cam.aspect = w / h; pv.cam.updateProjectionMatrix(); }
  pv.model.rotation.y += dt * 0.6;
  animateCharacter(pv.model, dt, 0, false);
  pv.renderer.render(pv.scene, pv.cam);
}

function buildLookUI() {
  const rows = [
    ['body', 'Character', 'sel'], ['outfit', 'Outfit', 'sel'], ['skin', 'Skin', SKIN_TONES],
    ['hairStyle', 'Hair', 'sel'], ['hair', 'Hair colour', HAIR_COLOURS], ['shirt', 'Top colour', CLOTH_COLOURS],
    ['pants', 'Bottom colour', CLOTH_COLOURS], ['hat', 'Hat', 'sel'],
  ];
  $('#lookOptions').innerHTML = rows.map(([k, label, kind]) => {
    if (kind === 'sel') {
      return `<div class="look-row"><span>${label}</span><div class="chips-sel">${LOOK_OPTIONS[k].map(([v, l]) =>
        `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${prefs.look[k] === v}">${l}</button>`).join('')}</div></div>`;
    }
    return `<div class="look-row"><span>${label}</span><div class="swatches">${kind.map(c =>
      `<button type="button" data-k="${k}" data-v="${c}" style="background:${c}" aria-label="${label} ${c}" aria-pressed="${prefs.look[k] === c}"></button>`).join('')}</div></div>`;
  }).join('');
}
$('#lookOptions').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]'); if (!b) return;
  setLook({ [b.dataset.k]: b.dataset.v });
});
$('#randomLook').addEventListener('click', () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  setLook({
    body: pick(LOOK_OPTIONS.body)[0], outfit: pick(LOOK_OPTIONS.outfit)[0], hairStyle: pick(LOOK_OPTIONS.hairStyle)[0],
    hat: pick(LOOK_OPTIONS.hat)[0], skin: pick(SKIN_TONES), hair: pick(HAIR_COLOURS), shirt: pick(CLOTH_COLOURS), pants: pick(CLOTH_COLOURS),
  });
});
function setLook(change) {
  prefs.look = sanitizeLook({ ...prefs.look, ...change });
  savePrefs(); updatePreview(); buildLookUI(); SFX.click();
  if (LOBBY) socket.emit('look', prefs.look);
}

// ============================================================
// SCREENS
// ============================================================
function showScreen(name) {
  screen = name;
  $('#menu').classList.toggle('hidden', name !== 'menu');
  $('#lobby').classList.toggle('hidden', name !== 'lobby');
  $('#hud').classList.toggle('hidden', name !== 'game');
  $('#touch').classList.toggle('hidden', !(name === 'game' && isTouch));
  document.body.classList.toggle('playing', name === 'game');
  if (name !== 'game') { $('#blackout').classList.add('hidden'); $('#headBanner').classList.add('hidden'); if (document.pointerLockElement) document.exitPointerLock(); }
  // move the customiser between menu and lobby
  const cust = $('#customiser');
  if (name === 'lobby') $('#customiserLobby').appendChild(cust);
  if (name === 'menu') $('#customiserHome').appendChild(cust);
}

function menuError(msg) { $('#menuError').textContent = msg || ''; }
function getName() {
  const n = $('#nameInput').value.trim().slice(0, 16);
  prefs.name = n; savePrefs();
  return n;
}
$('#nameInput').value = prefs.name || '';
const urlCode = new URLSearchParams(location.search).get('room');
if (urlCode) $('#codeInput').value = urlCode.toUpperCase().slice(0, 4);

function ensureConnected() { if (!socket.connected) socket.connect(); }

$('#createBtn').addEventListener('click', () => {
  SFX.unlock();
  const name = getName();
  if (!name) { menuError('Type your name first.'); $('#nameInput').focus(); return; }
  ensureConnected();
  menuError('');
  socket.emit('create', { name, look: prefs.look }, (res) => {
    if (!res?.ok) { menuError(res?.error || 'Could not create a room.'); return; }
    myId = res.id;
    history.replaceState(null, '', '?room=' + res.code);
    showScreen('lobby');
  });
});
function joinRoom() {
  SFX.unlock();
  const name = getName();
  const code = $('#codeInput').value.trim().toUpperCase();
  if (!name) { menuError('Type your name first.'); $('#nameInput').focus(); return; }
  if (code.length !== 4) { menuError('Room codes have 4 letters.'); $('#codeInput').focus(); return; }
  ensureConnected();
  menuError('');
  socket.emit('join', { code, name, look: prefs.look }, (res) => {
    if (!res?.ok) { menuError(res?.error || 'Could not join.'); return; }
    myId = res.id;
    history.replaceState(null, '', '?room=' + res.code);
    showScreen('lobby');
  });
}
$('#joinBtn').addEventListener('click', joinRoom);
$('#codeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom(); });
$('#codeInput').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });

// ============================================================
// LOBBY
// ============================================================
const AVATAR = { boy: '👦', girl: '👧', robot: '🤖' };
function buildSettingsForm() {
  $('#settingsForm').innerHTML = SETTINGS_SCHEMA.map(s => `<label><span>${esc(s.label)}</span><select data-key="${s.key}">${
    s.options.map((o, i) => `<option value="${i}">${esc(o[1])}</option>`).join('')}</select></label>`).join('');
}
$('#settingsForm').addEventListener('change', (e) => {
  const sel = e.target.closest('select'); if (!sel) return;
  const sch = SETTINGS_SCHEMA.find(s => s.key === sel.dataset.key);
  socket.emit('settings', { [sch.key]: sch.options[+sel.value][0] });
});
const PRESETS = {
  easy: { startLevel: 1, ramp: true, hints: 'always', headStart: 20, pingInterval: 30, pingDuration: 3, pingShowsSeeker: true, nearWarn: 14, seekerSpeed: 0.9, darkness: 'dim', roundTime: 300, lockerTime: 20 },
  normal: { startLevel: 1, ramp: true, hints: 'early', headStart: 15, pingInterval: 30, pingDuration: 3, pingShowsSeeker: true, nearWarn: 10, seekerSpeed: 1, darkness: 'dark', roundTime: 240, lockerTime: 20 },
  hard: { startLevel: 2, ramp: true, hints: 'never', headStart: 10, pingInterval: 45, pingDuration: 2, pingShowsSeeker: true, nearWarn: 6, seekerSpeed: 1.1, darkness: 'pitch', roundTime: 240, lockerTime: 10 },
};
$('#presets').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-preset]'); if (!b) return;
  socket.emit('settings', PRESETS[b.dataset.preset]);
});

function renderLobby(L) {
  LOBBY = L;
  const amHost = L.hostId === myId;
  $('#roomCode').textContent = L.code;
  $('#playerCount').textContent = `${L.players.length} of 12`;
  $('#playerList').innerHTML = L.players.map(p => `
    <li>
      <div class="avatar" style="--c:${p.look.shirt};--s:${p.look.pants}">${AVATAR[p.look.body] || '🙂'}</div>
      <div class="pname">${esc(p.name)} ${p.id === myId ? '<em>(you)</em>' : ''} ${p.id === L.hostId ? '<em>host</em>' : ''} ${p.status === 'waiting' ? '<em>joins next round</em>' : ''}</div>
      ${amHost && p.id !== myId ? `<button class="kick" data-kick="${p.id}">Remove</button>` : '<span></span>'}
    </li>`).join('');
  const n = L.players.length;
  const me = L.players.find(p => p.id === myId);
  let note = n === 1 ? 'Just you: <b>practice mode</b>. No seeker – find the words and escape. Share the code to add players!'
    : n === 2 ? '2 players: <b>duel</b>. A tag (or an escape) wins the round instantly, then you swap roles.'
      : `${n} players: tagged hiders go to <b>Prison</b>. A free friend can open the prison door to rescue them.`;
  if (L.phase !== 'lobby' && me && me.status === 'waiting') note = 'A game is already running. You will join at the start of the next round.';
  $('#lobbyNote').innerHTML = note;
  $('#startBtn').classList.toggle('hidden', !amHost);
  $('#startBtn').disabled = L.phase !== 'lobby';
  $('#startBtn').textContent = n === 1 ? 'Start practice' : 'Start game';
  $('#hostOnly').textContent = amHost ? '(you are the host)' : '(the host chooses)';
  $('#presets').classList.toggle('hidden', !amHost);
  for (const sel of document.querySelectorAll('#settingsForm select')) {
    const sch = SETTINGS_SCHEMA.find(s => s.key === sel.dataset.key);
    sel.value = String(Math.max(0, sch.options.findIndex(o => o[0] === L.settings[sch.key])));
    sel.disabled = !amHost;
  }
  const s = L.settings;
  const lv = [];
  for (let r = 1; r <= s.rounds; r++) lv.push(s.ramp ? Math.min(5, s.startLevel + r - 1) : s.startLevel);
  $('#levelPreview').innerHTML = lv.map((l, i) => `<span title="${esc(LEVELS[l].examples.join('  '))}">Round ${i + 1}: <b>${esc(LEVELS[l].example)}</b> + ${LEVELS[l].patterns - 1} other sentence types</span>`).join('');
}
$('#playerList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-kick]'); if (b) socket.emit('kick', b.dataset.kick);
});
$('#startBtn').addEventListener('click', () => { SFX.unlock(); socket.emit('start'); });
$('#leaveLobby').addEventListener('click', () => goMenu());
$('#copyLink').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}?room=${LOBBY?.code || ''}`;
  try { await navigator.clipboard.writeText(url); $('#copyLink').textContent = 'Link copied'; }
  catch (e) { $('#copyLink').textContent = url; }
  setTimeout(() => { $('#copyLink').textContent = 'Copy invite link'; }, 2000);
});

function goMenu(msg) {
  socket.emit('leave');
  cleanupGame();
  LOBBY = null;
  hideOverlay();
  showScreen('menu');
  menuError(msg || '');
}

// ============================================================
// SOCKET EVENTS
// ============================================================
socket.on('connect', () => {
  if (pendingRejoin && LOBBY) {
    const code = LOBBY.code;
    cleanupGame(); LOBBY = null; hideOverlay(); showScreen('menu');
    $('#codeInput').value = code;
    menuError(`Connection lost. Press Join to go back into room ${code}.`);
  }
  pendingRejoin = false;
  myId = socket.id;
});
socket.on('disconnect', (reason) => {
  if (LOBBY && reason !== 'io client disconnect') { pendingRejoin = true; toast('Connection lost – reconnecting…', 'bad'); }
});
socket.on('kicked', () => { pendingRejoin = false; goMenu('The host removed you from the room.'); });

socket.on('lobby', (L) => {
  renderLobby(L);
  if (L.phase === 'lobby' && (screen === 'game' || overlayKind === 'gameover')) { cleanupGame(); hideOverlay(); showScreen('lobby'); }
});
socket.on('roundStart', startRoundClient);
socket.on('roster', (list) => { if (G) onRoster(list); });
socket.on('snap', onSnap);
socket.on('teleport', onTeleport);
socket.on('collectResult', onCollect);
socket.on('event', onEvent);
socket.on('hidden', (d) => { if (!G) return; P.hidden = d.id; P.hideUntil = performance.now() + d.max * 1000; SFX.locker(); toast('Hiding! Stay still…'); });
socket.on('unhidden', (d) => {
  if (!G) return;
  const L = M.LOCKERS[d.id];
  P.hidden = null;
  if (L) { P.x = L.x + L.face[0] * 1.15; P.z = L.z + L.face[1] * 1.15; P.y = L.y; }
  if (d.reason === 'time') toast('Too long! You tumbled out of the locker.', 'bad');
});
socket.on('lockerFx', (d) => {
  world.lockerFx(d.id);
  const L = M.LOCKERS[d.id];
  if (L && Math.hypot(L.x - P.x, L.z - P.z) < 12) SFX.locker();
});
socket.on('searchResult', () => toast('Empty! Nobody in there.'));
socket.on('toast', (m) => toast(esc(m)));
socket.on('ping', (d) => {
  if (!G) return;
  const until = performance.now() + d.dur;
  G.pings = d.targets.map(t => ({ ...t, until }));
  SFX.ping();
  toast('Locator ping! The red arrows show where hiders are.', 'good');
});
socket.on('pinged', (d) => {
  if (!G) return;
  SFX.ping();
  $('#vignette').classList.add('on');
  setTimeout(() => $('#vignette').classList.remove('on'), Math.min(1500, d.dur));
  const until = performance.now() + d.dur;
  G.seekerPings = (d.seekers || []).map(sk => ({ ...sk, until }));
  if (G.seekerPings.length) toast('Pinged! The seeker knows where you are. The red arrow shows where the seeker is.', 'bad');
  else toast('The seeker\'s locator ping just found you – move!', 'bad');
});
socket.on('roundEnd', showRoundEnd);

// ---- vending machine, items, stuns, room alarm ----
socket.on('wallet', (d) => { if (!G) return; G.wallet = d; renderWallet(); if (overlayKind === 'shop') renderShop(); });
socket.on('buyResult', (d) => {
  if (!G) return;
  const names = { word: 'a word', taser: 'a taser', oil: 'a can of oil' };
  if (d.ok) {
    SFX.coin();
    if (d.item === 'taser') toast('Taser ready! Aim with the crosshair and press <b>Q</b> (or E / click) to fire.', 'good');
    if (d.item === 'oil') toast('Oil ready! Press <b>G</b> to drop it behind you while the seeker chases you.', 'good');
  } else {
    const why = { poor: `Not enough points for ${names[d.item]}.`, have: `You are already carrying ${names[d.item]}.`, done: 'Your sentence is already complete!', far: 'Stand in front of the vending machine.' }[d.reason] || 'Cannot buy that.';
    toast(why, 'bad'); SFX.wrong();
  }
  if (overlayKind === 'shop') renderShop();
});
socket.on('zap', (d) => {
  world.zap(d.from, d.to);
  if (G && Math.hypot(d.from.x - P.x, d.from.z - P.z) < 25) SFX.zap();
});
socket.on('slicks', (list) => { if (G) G.slicks = list; world.setSlicks(list); });
socket.on('stunned', (d) => {
  if (!G) return;
  G.stunUntil = performance.now() + d.dur; G.stunKind = d.kind;
  if (d.kind === 'oil') { P.slide = { t: 0, dir: P.ry }; SFX.slip(); } else SFX.zap();
  P.vault = null;
});
socket.on('roomAlarm', (d) => {
  if (!G) return;
  if (d.room) G.alarms.set(d.sid, { room: d.room, name: d.name, x: d.x, y: d.y, z: d.z }); else G.alarms.delete(d.sid);
  const active = new Set([...G.alarms.values()].map(a => a.room));
  for (const k in M.ROOMS) world.setAlarm(k, active.has(k));
  renderAlarm();
  if (d.room) {
    if (G.role === 'hider') SFX.alarm();
    else if (d.sid === myId) toast(`Alarm! The hiders know you are in the ${esc(M.ROOMS[d.room].name)}.`, 'bad');
  }
});
function renderAlarm() {
  const el = $('#alarm');
  const list = [...G.alarms.values()];
  const show = G.role === 'hider' && list.length > 0 && !G.over;
  el.classList.toggle('hidden', !show);
  if (!show) return;
  const R = M.ROOMS[list[0].room];
  el.style.setProperty('--rc', R.color);
  el.innerHTML = `ALARM! ${list.length > 1 ? 'Seekers are' : 'The seeker is'} in the <b>${esc(R.name)}</b>${list.length > 1 ? ' and more' : ''}`;
}
function renderWallet() {
  const on = G && G.settings.shop && G.role === 'hider' && G.status === 'free';
  $('#wallet').classList.toggle('hidden', !on);
  const w = G ? G.wallet : { pts: 0, taser: 0, oil: 0 };
  $('#wPts').textContent = w.pts;
  $('#wItems').innerHTML = (w.taser ? `<span>Taser ready · ${isTouch ? 'Taser button' : 'Q'}</span>` : '') + (w.oil ? `<span class="oil">Oil ready · ${isTouch ? 'Oil button' : 'G'}</span>` : '');
  $('#tTaser').classList.toggle('hidden', !(on && w.taser));
  $('#tOil').classList.toggle('hidden', !(on && w.oil));
}
function openShop() {
  showOverlay('shop', '<div id="shopBody"></div>');
  renderShop();
}
function renderShop() {
  const box = $('#shopBody'); if (!box || !G) return;
  const w = G.wallet, pr = SHOP.prices, done = G.filled.every(Boolean);
  const next = G.sentence.tokens.find((t, i) => !G.filled[i]);
  const items = [
    ['word', 1, 'Buy a word', done ? 'Your sentence is complete' : `Gives you your next word${G.hints && next ? ` (a ${TYPES[next.t].label.toLowerCase()})` : ''}`, pr.word, done],
    ['taser', 2, 'Taser (one shot)', 'Aim with the crosshair and fire. Stops the seeker for 3 s.', pr.taser, w.taser > 0],
    ['oil', 3, 'Can of oil (one use)', 'Drop it behind you. The seeker slips for 3 s.', pr.oil, w.oil > 0],
  ];
  box.innerHTML = `<h2>Vending machine</h2><p class="sub">You have <b style="color:#ffd166">${w.pts}</b> points. You earn 1 point a second and ${SHOP.perWord} for each word.</p>
    <div class="shop-items">${items.map(([k, n, t, sub, price, blocked]) => `
      <button data-buy="${k}" ${blocked || w.pts < price ? 'disabled' : ''}><kbd>${n}</kbd><span>${t}<small>${blocked && k !== 'word' ? 'Already carrying one' : esc(sub)}</small></span><span class="price">${price}</span></button>`).join('')}</div>
    <div class="ov-buttons"><button class="btn" id="shopClose">Close (Esc)</button></div>`;
  box.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => socket.emit('buy', b.dataset.buy));
  $('#shopClose').onclick = hideOverlay;
}
function fireTaser() {
  if (!G || G.role !== 'hider' || G.status !== 'free' || P.hidden !== null || !G.wallet.taser || P.vault) return;
  const aim = camYaw + Math.PI;
  P.ry = aim;
  socket.emit('s', [r2(P.x), r2(P.y), r2(P.z), r2(P.ry), r2(aim), 0, 0]);
  socket.emit('taser', r2(aim));
  G.wallet.taser = 0; renderWallet();
}
function dropOil() {
  if (!G || G.role !== 'hider' || G.status !== 'free' || P.hidden !== null || !G.wallet.oil) return;
  socket.emit('oil');
  G.wallet.oil = 0; renderWallet();
}
socket.on('gameOver', showGameOver);

// ============================================================
// ROUND FLOW
// ============================================================
function startRoundClient(d) {
  hideOverlay();
  G = {
    round: d.round, rounds: d.rounds, level: d.level, hints: d.hints, mode: d.mode, role: d.role, status: 'free',
    sentence: d.sentence, filled: d.filled.slice(), settings: d.settings, tables: d.tables, hostId: d.hostId,
    timeLeft: d.duration, headLeft: d.headStart, lastSnap: performance.now(), nextPingIn: -1,
    pings: [], seekerPings: [], near: 0, beatT: 0, done: false, over: false,
    wallet: { pts: 0, taser: 0, oil: 0 }, alarms: new Map(), stunUntil: 0, stunKind: '', slicks: [], roster: new Map(), anyJailed: false, headAnnounced: false, lastTick: -1,
  };
  onRoster(d.roster);
  world.setTableWords(d.tables);
  world.setSlicks([]);
  for (const k in M.ROOMS) world.setAlarm(k, false);
  P.slide = null;
  world.setExitUnlocked(false);
  world.setDarkness(d.settings.darkness, prefs.brightness);
  P.x = d.spawn.x; P.y = d.spawn.y; P.z = d.spawn.z;
  P.hidden = null; P.crouch = false; P.run = false; P.stamina = 1; P.tired = false; P.vault = null;
  P.torch = d.role === 'seeker' || d.settings.hiderLights;
  P.ry = d.role === 'seeker' ? Math.PI : 0;
  camYaw = d.role === 'seeker' ? 0 : Math.PI; camPitch = 0.3;
  myMesh.visible = true;
  myRing.visible = d.role === 'seeker';
  $('#minimap').classList.toggle('hidden', !d.settings.minimap);
  showScreen('game');
  buildMinimapBase();
  renderGoal();
  const badge = $('#roleBadge');
  badge.textContent = d.role === 'seeker' ? 'Seeker' : 'Hider';
  badge.className = d.role;
  $('#roundInfo').textContent = `Round ${d.round} of ${d.rounds} · Level ${d.level}`;
  updateTouchButtons();
  renderWallet(); renderAlarm();
  SFX.unlock(); SFX.startAmbient();
  if (d.role === 'seeker') {
    $('#blackout').classList.remove('hidden');
  } else if (d.mode !== 'practice') {
    $('#headBanner').classList.remove('hidden');
  }
  if (d.role === 'hider') {
    bigMsg(d.mode === 'practice' ? 'Practice!' : 'Hide!', 'Find the words for your sentence');
    setTimeout(() => SFX.speak('Find the words. ' + d.sentence.text), 600);
  } else {
    SFX.speak('You are the seeker. Count!');
  }
}

function onRoster(list) {
  G.roster = new Map(list.map(p => [p.id, p]));
  const meR = G.roster.get(myId);
  if (meR) G.status = meR.status;
  G.anyJailed = list.some(p => p.status === 'jailed');
  for (const p of list) if (p.id !== myId && p.status !== 'waiting') ensureRemote(p);
  for (const [id, r] of remotes) if (!G.roster.has(id) || G.roster.get(id).status === 'waiting') removeRemote(id);
  if (overlayKind === 'scores') renderScoreboard();
  renderGoal(false);
  renderWallet();
}

function ensureRemote(p) {
  let r = remotes.get(p.id);
  const lk = JSON.stringify(p.look);
  if (r && r.lookKey !== lk) { removeRemote(p.id); r = null; }
  if (!r) {
    const mesh = buildCharacter(p.look);
    const ring = makeRing(); mesh.add(ring);
    const beam = new THREE.Mesh(beamGeo, beamMat); beam.visible = false; scene.add(beam);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
    tag.position.y = 2.05; tag.scale.set(1.0, 0.25, 1); mesh.add(tag);
    mesh.visible = false;
    scene.add(mesh);
    r = { id: p.id, mesh, ring, beam, tag, lookKey: lk, cur: null, tgt: null, flags: 0, seen: false, speed: 0, tagKey: '' };
    remotes.set(p.id, r);
  }
  r.role = p.role; r.status = p.status; r.name = p.name;
  const key = p.name + '|' + p.role;
  if (r.tagKey !== key) { r.tagKey = key; r.tag.material.map?.dispose(); r.tag.material.map = nameTex(p.name, p.role === 'seeker'); r.tag.material.needsUpdate = true; }
}
function removeRemote(id) {
  const r = remotes.get(id); if (!r) return;
  scene.remove(r.mesh); scene.remove(r.beam);
  remotes.delete(id);
}
function nameTex(name, seeker) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.font = '900 30px "Nunito", system-ui, sans-serif';
  const w = Math.min(248, g.measureText(name).width + 34);
  g.fillStyle = seeker ? 'rgba(200,30,30,0.9)' : 'rgba(15,17,24,0.8)';
  g.beginPath(); g.roundRect ? g.roundRect((256 - w) / 2, 8, w, 46, 14) : g.rect((256 - w) / 2, 8, w, 46); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(name, 128, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function onSnap(s) {
  if (!G) return;
  G.timeLeft = s.t; G.headLeft = s.h; G.lastSnap = performance.now();
  if (s.np !== undefined) G.nextPingIn = s.np;
  for (const r of remotes.values()) r.seen = false;
  for (const row of s.p) {
    const [id, x, y, z, ry, aim, pitch, flags] = row;
    if (id === myId) continue;
    const r = remotes.get(id);
    if (!r) continue;
    r.tgt = { x, y, z, ry, aim, pitch };
    r.flags = flags; r.seen = true;
  }
}

function onTeleport(d) {
  if (!G) return;
  P.x = d.x; P.y = d.y; P.z = d.z; P.hidden = null; P.vault = null;
  if (d.reason === 'jailed') { G.status = 'jailed'; SFX.tag(); }
  if (d.reason === 'released') { G.status = 'free'; bigMsg('Free!', 'Run and hide!'); SFX.rescue(); }
  if (d.reason === 'escaped') { G.status = 'escaped'; camYaw = 0; }
  renderGoal(false);
}

function onCollect(d) {
  if (!G) return;
  if (d.ok) {
    G.filled[d.index] = true;
    SFX.pickup();
    SFX.speak(d.word, 0.85);
    renderGoal(true, d.index);
    if (d.done) {
      G.done = true;
      world.setExitUnlocked(true);
      const text = G.sentence.text;
      setTimeout(() => { SFX.complete(); SFX.speak(text + ' Now run to the exit!'); }, 700);
      bigMsg('Sentence complete!', 'Follow the green arrow to the nearest EXIT');
      renderGoal(false);
    }
  } else {
    SFX.wrong();
    if (d.reason === 'already') toast(`You already have “${esc(d.word)}”.`, 'bad');
    else if (d.reason === 'twin') { toast(`So close! Your sentence needs “${esc(d.want)}”, not “${esc(d.word)}”. Look at the ending.`, 'bad'); SFX.speak(`Look closely. You need ${d.want}.`); }
    else toast(`“${esc(d.word)}” is not in your sentence. Look again!`, 'bad');
  }
}

function onEvent(e) {
  if (e.type === 'tag') {
    if (e.hid === myId) bigMsg(G?.mode === 'duel' ? 'Tagged!' : 'Caught!', e.locker ? 'The seeker opened your locker!' : `${e.seeker} tagged you`);
    else if (e.sid === myId) { bigMsg('Tagged!', `You caught ${e.hider}`); SFX.tag(); }
    else { toast(`${esc(e.seeker)} caught ${esc(e.hider)}!`, 'bad'); SFX.tag(); }
  } else if (e.type === 'escape') {
    if (e.id === myId) { bigMsg('You escaped!', e.sentence); SFX.escape(); }
    else toast(`${esc(e.name)} escaped!`, 'good');
  } else if (e.type === 'rescue') {
    world.prisonFlash();
    toast(`${esc(e.name)} opened the prison! ${e.count} friend${e.count > 1 ? 's' : ''} freed.`, 'good');
  } else if (e.type === 'stun') {
    if (e.sid === myId) bigMsg(e.kind === 'oil' ? 'Slipped!' : 'Zapped!', e.kind === 'oil' ? `${e.by} left an oil slick` : `${e.by} got you with a taser`, 2000);
    else toast(e.kind === 'oil' ? `${esc(e.seeker)} slipped on ${esc(e.by)}'s oil!` : `${esc(e.by)} zapped ${esc(e.seeker)}!`, 'good');
  } else if (e.type === 'left') toast(`${esc(e.name)} left the game.`);
  else if (e.type === 'joined') toast(`${esc(e.name)} will join next round.`);
}

// ---------- round end / game over overlays ----------
let overlayKind = null;
function showOverlay(kind, html) { overlayKind = kind; $('#overlayBox').innerHTML = html; $('#overlay').classList.remove('hidden'); if (document.pointerLockElement) document.exitPointerLock(); }
function hideOverlay() { overlayKind = null; $('#overlay').classList.add('hidden'); }
function scoreTable(scores) {
  return `<table class="scores">${scores.map((p, i) => `<tr class="${p.id === myId ? 'me' : ''}"><td>${i + 1}. ${esc(p.name)}${p.id === myId ? ' (you)' : ''}</td><td>${p.score}</td></tr>`).join('')}</table>`;
}
function sentenceChips(tokens, filled) {
  return tokens.map((t, i) => `<span class="${filled[i] ? 'got' : ''}" style="--c:${TYPES[t.t].color}">${esc(i === 0 ? cap1(t.w) : t.w)}</span>`).join('');
}
let nextTimer = null;
function showRoundEnd(d) {
  if (G) G.over = true;
  $('#blackout').classList.add('hidden'); $('#headBanner').classList.add('hidden'); $('#nearWarn').classList.add('hidden');
  for (const id of ['#alarm', '#stunMsg', '#crosshair', '#wallet', '#tTaser', '#tOil']) $(id).classList.add('hidden');
  for (const k in M.ROOMS) world.setAlarm(k, false);
  for (const id of ['#edgeL', '#edgeR', '#edgeT', '#edgeB']) $(id).style.opacity = 0;
  let title = d.winner === 'hiders' ? 'The hiders win!' : d.winner === 'seekers' ? (d.seekers.length > 1 ? 'The seekers win!' : 'The seeker wins!') : 'Round over';
  if (d.mode === 'duel' && G) title = ((d.winner === 'hiders') === (G.role === 'hider')) ? 'You win the round!' : 'You lose the round';
  if (d.mode === 'practice') title = d.winner === 'hiders' ? 'You escaped!' : 'Time\'s up!';
  const why = { time: 'Time ran out.', tag: 'A hider was tagged.', escape: 'A hider escaped through the exit.', done: 'Every hider has escaped or been caught.', seekerLeft: 'The seeker left the game.', noHiders: 'All the hiders left.' }[d.reason] || '';
  const hiders = d.hiders.map(h => `<div class="res"><div class="who">${esc(h.name)} · ${h.status === 'escaped' ? 'escaped' : h.status === 'jailed' ? 'caught' : 'still hiding'}</div><div class="sent">${sentenceChips(h.tokens, h.filled)}</div></div>`).join('');
  const seekers = d.seekers.map(s => `${esc(s.name)} tagged ${s.tags}`).join(' · ');
  showOverlay('round', `
    <h2>${esc(title)}</h2>
    <p class="sub">${why}${seekers ? ' Seeker: ' + seekers + '.' : ''}</p>
    <div class="results">${hiders}</div>
    ${scoreTable(d.scores)}
    <p class="sub" style="margin-top:14px">${d.isLast ? 'Final scores in' : 'Next round in'} <b id="nextIn">${Math.round(d.pause / 1000)}</b> seconds…</p>`);
  SFX.speak(title);
  let left = Math.round(d.pause / 1000);
  clearInterval(nextTimer);
  nextTimer = setInterval(() => { left--; const el = $('#nextIn'); if (el) el.textContent = Math.max(0, left); if (left <= 0) clearInterval(nextTimer); }, 1000);
}
function showGameOver(d) {
  clearInterval(nextTimer);
  if (G) G.over = true;
  const s = d.scores;
  const podium = [s[1], s[0], s[2]].map((p, i) => p ? `<div><div class="nm">${esc(p.name)}</div><div class="block" style="height:${[70, 100, 50][i]}px">${[2, 1, 3][i]}</div></div>` : '').join('');
  const amHost = (LOBBY?.hostId || d.hostId) === myId;
  showOverlay('gameover', `
    <h2>Game over!</h2>
    <p class="sub">${s[0] ? esc(s[0].name) + ' is the Warehouse Champion!' : ''}</p>
    <div class="podium">${podium}</div>
    ${scoreTable(s)}
    <div class="ov-buttons">
      ${amHost ? '<button class="btn primary" id="toLobbyBtn">Back to the lobby</button>' : '<p class="sub">Waiting for the host to start a new game…</p>'}
      <button class="btn ghost" id="ovLeave">Leave</button>
    </div>`);
  $('#toLobbyBtn')?.addEventListener('click', () => socket.emit('toLobby'));
  $('#ovLeave').addEventListener('click', () => goMenu());
  SFX.escape();
}

function cleanupGame() {
  for (const id of [...remotes.keys()]) removeRemote(id);
  G = null;
  P.hidden = null;
  for (const id of ['#alarm', '#stunMsg', '#crosshair', '#wallet', '#tTaser', '#tOil', '#nearWarn']) $(id).classList.add('hidden');
  for (const k in M.ROOMS) world.setAlarm(k, false);
  world.setSlicks([]);
  myMesh.visible = false;
  for (const p of pillars) p.visible = false;
  clearInterval(nextTimer);
}

// ---------- pause menu & scoreboard ----------
function openPause() {
  const amHost = LOBBY?.hostId === myId;
  showOverlay('pause', `
    <h2>Menu</h2>
    <div class="opt-row"><span>Sound effects</span><button class="btn small" id="oSound">${prefs.sound ? 'On' : 'Off'}</button></div>
    <div class="opt-row"><span>Read words aloud</span><button class="btn small" id="oSpeak">${prefs.speak ? 'On' : 'Off'}</button></div>
    <div class="opt-row"><span>Graphics</span><button class="btn small" id="oQual">${prefs.quality === 'high' ? 'High' : 'Fast'}</button></div>
    <div class="opt-row"><label for="oBright">Brightness</label><input type="range" id="oBright" min="0.6" max="2.2" step="0.1" value="${prefs.brightness}"></div>
    <div class="opt-row"><label for="oSens">Look speed</label><input type="range" id="oSens" min="0.3" max="2.5" step="0.1" value="${prefs.sens}"></div>
    <div class="ov-buttons">
      <button class="btn primary" id="oResume">Resume</button>
      ${amHost ? '<button class="btn danger" id="oEnd">End game for everyone</button>' : ''}
      <button class="btn ghost" id="oLeave">Leave game</button>
    </div>`);
  $('#oSound').onclick = (e) => { prefs.sound = !prefs.sound; SFX.setSound(prefs.sound); e.target.textContent = prefs.sound ? 'On' : 'Off'; savePrefs(); };
  $('#oSpeak').onclick = (e) => { prefs.speak = !prefs.speak; SFX.setSpeak(prefs.speak); e.target.textContent = prefs.speak ? 'On' : 'Off'; savePrefs(); };
  $('#oQual').onclick = (e) => { prefs.quality = prefs.quality === 'high' ? 'low' : 'high'; e.target.textContent = prefs.quality === 'high' ? 'High' : 'Fast'; savePrefs(); resize(); };
  $('#oBright').oninput = (e) => { prefs.brightness = +e.target.value; savePrefs(); world.setDarkness(G?.settings.darkness || 'dark', prefs.brightness); };
  $('#oSens').oninput = (e) => { prefs.sens = +e.target.value; savePrefs(); };
  $('#oResume').onclick = hideOverlay;
  $('#oLeave').onclick = () => goMenu();
  $('#oEnd')?.addEventListener('click', () => socket.emit('endGame'));
}
function renderScoreboard() {
  if (!G) return;
  const list = [...G.roster.values()].filter(p => p.status !== 'waiting').sort((a, b) => b.score - a.score);
  const st = { free: 'free', jailed: 'in prison', escaped: 'escaped' };
  showOverlay('scores', `<h2>Scores</h2><table class="scores">${list.map(p => `<tr class="${p.id === myId ? 'me' : ''}"><td>${esc(p.name)} · ${p.role}${p.role === 'hider' ? ` · ${st[p.status] || p.status} · ${p.got}/${p.need} words` : ''}</td><td>${p.score}</td></tr>`).join('')}</table><div class="ov-buttons"><button class="btn" id="scClose">Close</button></div>`);
  $('#scClose').onclick = hideOverlay;
}
$('#pauseBtn').addEventListener('click', openPause);
$('#scoreBtn').addEventListener('click', renderScoreboard);

// ============================================================
// HUD
// ============================================================
function toast(html, kind = '', ms = 3200) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.innerHTML = html;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.remove(), ms);
}
let bigT = null;
function bigMsg(title, sub = '', ms = 2600) {
  $('#bigMsg').innerHTML = `<h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}`;
  clearTimeout(bigT); bigT = setTimeout(() => { $('#bigMsg').innerHTML = ''; }, ms);
}

function renderGoal(full = true, popIndex = -1) {
  if (!G) return;
  const el = $('#goal');
  if (G.role === 'hider') {
    if (!full && el.dataset.kind === 'hider' && !G.done && el.dataset.done === '0') { /* only status changes */ }
    const tok = G.sentence.tokens;
    const chips = tok.map((t, i) => {
      const ty = TYPES[t.t];
      const rot = ((i * 37) % 7 - 3) * 0.7;
      const w = (i === 0 ? cap1(t.w) : t.w) + (i === tok.length - 1 ? '.' : '');
      return `<span class="chip ${G.filled[i] ? 'got' : ''} ${i === popIndex ? 'pop' : ''}" style="--r:${rot}deg;${G.hints ? `--c:${ty.color}` : ''}">${esc(w)}${G.hints ? `<small>${ty.label}</small>` : ''}</span>`;
    }).join('');
    const title = G.status === 'escaped' ? 'You escaped with your sentence!' : G.done ? 'Sentence complete! Run to the EXIT!' : 'Find these words:';
    el.innerHTML = `<div class="goal-title ${G.done ? 'done' : ''}">${title}</div><div class="chips">${chips}</div>`;
    el.dataset.kind = 'hider'; el.dataset.done = G.done ? '1' : '0';
  } else if (G.role === 'seeker') {
    const free = [...G.roster.values()].filter(p => p.role === 'hider' && p.status === 'free').length;
    el.innerHTML = `<div class="seek-goal"><span>Find and tag the hiders!</span><span>Hiders free: <b id="hidersFree">${free}</b></span><span id="pingIn"></span></div>`;
    el.dataset.kind = 'seeker';
  }
  // status line
  let st = '';
  if (G.status === 'jailed') st = G.settings.rescue ? 'You are in prison. Wait for a friend to open the door!' : 'You are in prison until the round ends.';
  else if (G.status === 'escaped') st = 'You escaped! Cheer on your friends from the yard.';
  $('#status').textContent = st;
}

// ---------- minimap (shows the floor you are on) ----------
const MS = 4.4;
let mmBases = [];
const mm = $('#minimap'), mctx = mm.getContext('2d');
function buildMinimapBase() {
  mmBases = [0, 1].map(level => {
    const c = document.createElement('canvas');
    c.width = M.W * MS; c.height = M.H * MS;
    const g = c.getContext('2d');
    g.fillStyle = '#08090d'; g.fillRect(0, 0, c.width, c.height);
    for (let cz = 0; cz < M.H; cz++) for (let cx = 0; cx < M.W; cx++) {
      const ch = M.glyph(cx, cz, level);
      if (ch === ' ') continue;
      const room = M.roomAtCell(cx, cz, level);
      let col = room ? M.ROOMS[room].color + '55' : '#34312b';
      if (ch === 'o' || ch === 'f') col = '#1f2b1a';
      if (ch === '#') col = '#6b665c';
      else if ('SC'.includes(ch)) col = '#1b1a17';
      else if ('cbi'.includes(ch)) col = '#2a2723';
      else if (ch === 'w') col = room ? M.ROOMS[room].color : '#aaa';
      else if (ch === 'L') col = '#4c6a63';
      else if (ch === '|' || ch === 'd') col = '#c33';
      else if (ch === 'P') col = '#4a1f1f';
      else if (ch === 'E') col = '#2fbf5a';
      else if (ch === 'v') col = '#ffd166';
      else if (ch === 'M') col = '#7fd0ff';
      g.fillStyle = col;
      g.fillRect(cx * MS, cz * MS, MS + 0.3, MS + 0.3);
    }
    return c;
  });
}
function stairAccess(level) {
  // walkable cell next to each stairway on this floor (top on the ground floor, bottom in the basement)
  return M.STAIRS.map(st => {
    const [x, z] = M.cellCenter(st.x, level === 0 ? st.z0 - 1 : st.z1 + 1);
    return { x, z, name: st.name };
  });
}
function nearestStair(level) {
  let best = null, bd = Infinity;
  for (const a of stairAccess(level)) { const dd = d2(P, a.x, a.z); if (dd < bd) { bd = dd; best = a; } }
  return best;
}
let lastFloorText = '';
function drawMinimap(t) {
  if (!mmBases.length || !G) return;
  const lv = myLevel();
  // floor label + which floor the missing words are on
  let txt = M.FLOOR_NAMES[lv];
  if (G.role === 'hider' && G.status === 'free' && !G.done) {
    const other = [...new Set(G.sentence.tokens.filter((tk, i) => !G.filled[i]).map(tk => TYPES[tk.t].room))]
      .filter(k => M.ROOMS[k].floor !== lv).map(k => M.ROOMS[k].name);
    if (other.length) txt += ` · ${lv === 0 ? 'Downstairs' : 'Upstairs'}: ${other.join(', ')}`;
  }
  if (G.role === 'hider' && G.done && G.status === 'free') txt += ' · Exits: one on each floor';
  if (txt !== lastFloorText) { lastFloorText = txt; $('#floorLabel').textContent = txt; }
  if (!G.settings.minimap) return;
  const w = mm.width, h = mm.height;
  mctx.clearRect(0, 0, w, h);
  mctx.drawImage(mmBases[lv], 0, 0, w, h);
  const sx = w / (M.W * M.CELL), sz = h / (M.H * M.CELL);
  const dot = (x, z, r, col) => { mctx.fillStyle = col; mctx.beginPath(); mctx.arc(x * sx, z * sz, r, 0, 7); mctx.fill(); };
  if (G.role === 'hider' && G.hints && !G.done && G.status === 'free') {
    const need = new Set(G.sentence.tokens.filter((tk, i) => !G.filled[i]).map(tk => TYPES[tk.t].room));
    mctx.lineWidth = 2;
    for (const k of need) {
      if (M.ROOMS[k].floor !== lv) continue;
      const [x0, z0, x1, z1] = M.ROOMS[k].rect;
      mctx.strokeStyle = M.ROOMS[k].color; mctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 5);
      mctx.strokeRect(x0 * M.CELL * sx, z0 * M.CELL * sz, (x1 - x0 + 1) * M.CELL * sx, (z1 - z0 + 1) * M.CELL * sz);
    }
    mctx.globalAlpha = 1;
  }
  if (G.role === 'hider' && G.done && G.status === 'free') for (const ex of M.EXITS) if (ex.floor === lv) dot(ex.point.x, ex.point.z - 0.8 * ex.face[1], 3.5 + 1.5 * Math.sin(t * 6), '#37ff6a');
  for (const r of remotes.values()) {
    if (!r.seen || !r.cur || (r.flags & 16) || M.levelOfY(r.cur.y) !== lv) continue;
    if (G.role === 'hider' && r.role === 'hider' && r.status === 'free') dot(r.cur.x, r.cur.z, 2.4, '#5ad85a');
    if (G.role === 'seeker' && r.role === 'seeker') dot(r.cur.x, r.cur.z, 2.4, '#ff5a5a');
  }
  const now = performance.now();
  if (G.role === 'seeker') for (const p of G.pings) if (now < p.until && M.levelOfY(p.y || 0) === lv) dot(p.x, p.z, 3 + 2 * Math.sin(t * 10), '#ff3030');
  if (G.role === 'hider') for (const [sid, a] of G.alarms) {
    const R = M.ROOMS[a.room];
    if (R.floor === lv) {
      const [x0, z0, x1, z1] = R.rect;
      mctx.fillStyle = Math.sin(t * 14) > 0 ? 'rgba(255,30,30,0.45)' : 'rgba(255,30,30,0.1)';
      mctx.fillRect(x0 * M.CELL * sx, z0 * M.CELL * sz, (x1 - x0 + 1) * M.CELL * sx, (z1 - z0 + 1) * M.CELL * sz);
      const r = remotes.get(sid), pos = r && r.cur ? r.cur : a;
      dot(pos.x, pos.z, 4.5, '#ff2020');
    }
  }
  if (G.role === 'hider') for (const p of G.seekerPings) if (now < p.until && M.levelOfY(p.y || 0) === lv) {
    if (Math.sin(t * 12) > -0.3) dot(p.x, p.z, 4.5, '#ff2020');
    mctx.strokeStyle = '#ff2020'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(p.x * sx, p.z * sz, 7 + 3 * Math.sin(t * 6), 0, 7); mctx.stroke();
  }
  mctx.save();
  mctx.translate(P.x * sx, P.z * sz);
  mctx.rotate(-P.ry);
  mctx.fillStyle = '#ffffff';
  mctx.beginPath(); mctx.moveTo(0, 5); mctx.lineTo(3.4, -3.3); mctx.lineTo(-3.4, -3.3); mctx.closePath(); mctx.fill();
  mctx.restore();
}

// ---------- direction arrows ----------
const arrowEls = [];
function updateArrows() {
  const items = [];
  const now = performance.now();
  const lv = myLevel();
  if (G.role === 'seeker') for (const p of G.pings) if (now < p.until) {
    const pl = M.levelOfY(p.y || 0);
    items.push({ x: p.x, z: p.z, c: '#ff4040', label: Math.round(Math.hypot(p.x - P.x, p.z - P.z)) + ' m' + (pl > lv ? ' (downstairs)' : pl < lv ? ' (upstairs)' : '') });
  }
  if (G.role === 'hider') for (const [sid, a] of G.alarms) {
    const r = remotes.get(sid), pos = r && r.cur ? r.cur : a;
    if (M.levelOfY(pos.y || 0) === lv) items.push({ x: pos.x, z: pos.z, c: M.ROOMS[a.room].color, label: 'SEEKER in ' + M.ROOMS[a.room].name });
  }
  if (G.role === 'hider') for (const p of G.seekerPings) if (now < p.until) {
    const pl = M.levelOfY(p.y || 0);
    items.push({ x: p.x, z: p.z, c: '#ff2a2a', label: 'SEEKER ' + Math.round(Math.hypot(p.x - P.x, p.z - P.z)) + ' m' + (pl > lv ? ' (downstairs)' : pl < lv ? ' (upstairs)' : '') });
  }
  if (G.role === 'hider' && G.status === 'free') {
    let goal = null, label = '', col = '';
    if (G.done) {
      // every floor has an exit – point at the nearest one on this floor
      let best = null, bd = Infinity;
      for (const ex of M.EXITS) if (ex.floor === lv) { const dd = d2(P, ex.point.x, ex.point.z); if (dd < bd) { bd = dd; best = ex.point; } }
      if (best) items.push({ x: best.x, z: best.z, c: '#37ff6a', label: 'EXIT' });
    } else if (G.anyJailed && G.settings.rescue) {
      goal = M.RESCUE_POINT; label = 'Rescue'; col = '#ffb300';
      if (lv !== 0) { const st = nearestStair(lv); items.push({ x: st.x, z: st.z, c: col, label: 'Stairs up' }); }
      else items.push({ x: goal.x, z: goal.z, c: col, label });
    }
  }
  const box = $('#arrows');
  while (arrowEls.length < items.length) { const a = document.createElement('div'); a.className = 'arrow'; a.innerHTML = '<i></i><b></b>'; box.appendChild(a); arrowEls.push(a); }
  const camA = camYaw + Math.PI;
  const cx = innerWidth / 2, cy = innerHeight / 2, R = Math.min(innerWidth, innerHeight) * 0.3;
  arrowEls.forEach((a, i) => {
    const it = items[i];
    if (!it) { a.style.display = 'none'; return; }
    const dx = it.x - P.x, dz = it.z - P.z;
    if (Math.hypot(dx, dz) < 2.5) { a.style.display = 'none'; return; }
    const rel = Math.atan2(dx, dz) - camA;
    const s = -rel;
    a.style.display = 'block';
    a.style.left = (cx + Math.sin(s) * R) + 'px';
    a.style.top = (cy - Math.cos(s) * R) + 'px';
    a.style.setProperty('--c', it.c);
    a.querySelector('i').style.transform = `rotate(${s}rad)`;
    a.querySelector('b').textContent = it.label;
  });
}

// ping pillars (seeker sees red beams at hiders' positions)
const pillars = [];
function updatePillars() {
  const now = performance.now();
  const list = !G ? [] : (G.role === 'seeker' ? G.pings : G.seekerPings).filter(p => now < p.until);
  while (pillars.length < list.length) {
    const m = new THREE.Mesh(pillarGeo, new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false }));
    scene.add(m); pillars.push(m);
  }
  pillars.forEach((m, i) => {
    const p = list[i];
    m.visible = !!p;
    if (p) { m.position.set(p.x, (p.y || 0) + 6, p.z); m.material.opacity = 0.4 * clamp((p.until - now) / 800, 0, 1); }
  });
}

// ============================================================
// INPUT
// ============================================================
const keys = {};
const typing = () => ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
addEventListener('keydown', (e) => {
  if (typing()) return;
  if (screen !== 'game') return;
  if (e.code === 'Tab') { e.preventDefault(); if (overlayKind !== 'scores') renderScoreboard(); return; }
  if (e.code === 'Escape') { if (overlayKind === 'pause' || overlayKind === 'shop') hideOverlay(); else if (!overlayKind) openPause(); return; }
  if (overlayKind === 'shop' && /^Digit[123]$/.test(e.code)) { socket.emit('buy', ['word', 'taser', 'oil'][+e.code.slice(5) - 1]); return; }
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); doAction(); }
  if (e.code === 'KeyC' || e.code === 'ControlLeft') toggleCrouch();
  if (e.code === 'KeyF') toggleTorch();
  if (e.code === 'KeyQ') fireTaser();
  if (e.code === 'KeyG') dropOil();
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Tab' && overlayKind === 'scores') hideOverlay();
});
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function toggleCrouch() { if (!G) return; P.crouch = !P.crouch; updateTouchButtons(); }
function toggleTorch() {
  if (!G) return;
  if (G.role === 'hider' && !G.settings.hiderLights) { toast('Torches are switched off for hiders this game.'); return; }
  P.torch = !P.torch; SFX.click(); updateTouchButtons();
}

// mouse look
let dragging = false, lastMX = 0, lastMY = 0;
canvas.addEventListener('mousedown', (e) => {
  SFX.unlock();
  if (screen !== 'game' || isTouch || overlayKind) return;
  if (document.pointerLockElement === canvas && e.button === 0 && G && G.wallet.taser) fireTaser();
  if (canvas.requestPointerLock && !document.pointerLockElement) {
    try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) { /* ignore */ }
  }
  dragging = true; lastMX = e.clientX; lastMY = e.clientY;
});
addEventListener('mouseup', () => { dragging = false; });
addEventListener('mousemove', (e) => {
  if (screen !== 'game') return;
  let dx = 0, dy = 0;
  if (document.pointerLockElement === canvas) { dx = e.movementX; dy = e.movementY; }
  else if (dragging) { dx = e.clientX - lastMX; dy = e.clientY - lastMY; lastMX = e.clientX; lastMY = e.clientY; }
  else return;
  camYaw -= dx * 0.0026 * prefs.sens;
  camPitch = clamp(camPitch + dy * 0.002 * prefs.sens, -0.3, 1.15);
});
canvas.addEventListener('wheel', (e) => { if (screen === 'game') camDist = clamp(camDist + Math.sign(e.deltaY) * 0.4, 1.8, 6); }, { passive: true });

// touch controls: left half = joystick, right half = look
const touch = { stickId: null, ox: 0, oy: 0, x: 0, y: 0, lookId: null, lx: 0, ly: 0 };
const stickEl = $('#stick'), knobEl = $('#knob');
document.addEventListener('touchstart', (e) => {
  SFX.unlock();
  if (screen !== 'game' || overlayKind) return;
  for (const t of e.changedTouches) {
    if (t.target.closest && t.target.closest('button, #overlay, .panel')) continue;
    if (t.clientX < innerWidth * 0.45 && touch.stickId === null) {
      touch.stickId = t.identifier; touch.ox = t.clientX; touch.oy = t.clientY; touch.x = touch.y = 0;
      stickEl.style.left = t.clientX + 'px'; stickEl.style.top = t.clientY + 'px';
    } else if (touch.lookId === null) {
      touch.lookId = t.identifier; touch.lx = t.clientX; touch.ly = t.clientY;
    }
  }
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (screen !== 'game') return;
  for (const t of e.changedTouches) {
    if (t.identifier === touch.stickId) {
      let dx = (t.clientX - touch.ox) / 50, dy = (t.clientY - touch.oy) / 50;
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      touch.x = dx; touch.y = dy;
      knobEl.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
    } else if (t.identifier === touch.lookId) {
      camYaw -= (t.clientX - touch.lx) * 0.006 * prefs.sens;
      camPitch = clamp(camPitch + (t.clientY - touch.ly) * 0.004 * prefs.sens, -0.3, 1.15);
      touch.lx = t.clientX; touch.ly = t.clientY;
    }
  }
}, { passive: true });
function endTouch(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === touch.stickId) {
      touch.stickId = null; touch.x = touch.y = 0; knobEl.style.transform = '';
      stickEl.style.left = '90px'; stickEl.style.top = 'calc(100% - 130px)';
    }
    if (t.identifier === touch.lookId) touch.lookId = null;
  }
}
document.addEventListener('touchend', endTouch);
document.addEventListener('touchcancel', endTouch);
$('#tAct').addEventListener('click', doAction);
$('#tCrouch').addEventListener('click', toggleCrouch);
$('#tRun').addEventListener('click', () => { P.run = !P.run; updateTouchButtons(); });
$('#tLight').addEventListener('click', toggleTorch);
$('#tScores').addEventListener('click', renderScoreboard);
$('#tTaser').addEventListener('click', fireTaser);
$('#tOil').addEventListener('click', dropOil);
function updateTouchButtons() {
  $('#tCrouch').classList.toggle('on', P.crouch);
  $('#tRun').classList.toggle('on', P.run);
  $('#tLight').classList.toggle('on', P.torch);
}

// ============================================================
// ACTIONS
// ============================================================
let currentAction = null, lastActionAt = 0;
function liveHead() { return G ? G.headLeft - (performance.now() - G.lastSnap) : 0; }
function liveTime() { return G ? Math.max(0, G.timeLeft - (performance.now() - G.lastSnap)) : 0; }
const d2 = (a, x, z) => (a.x - x) ** 2 + (a.z - z) ** 2;

function computeAction() {
  if (!G || G.over) return null;
  if (performance.now() < G.stunUntil) return null;
  if (P.hidden !== null) return { type: 'unhide', label: 'Leave the locker' };
  if (G.role === 'hider' && G.status === 'free') {
    const ground = myLevel() === 0;
    if (G.done) for (const ex of M.EXITS) if (ex.floor === myLevel() && d2(P, ex.point.x, ex.point.z) < 6.8) return { type: 'escape', label: 'ESCAPE!' };
    if (ground && G.settings.rescue && G.anyJailed && d2(P, M.RESCUE_POINT.x, M.RESCUE_POINT.z) < 6.8) return { type: 'rescue', label: 'Open the prison door' };
    if (G.settings.shop) for (const v of M.VENDING) if (v.floor === myLevel() && d2(P, v.use.x, v.use.z) < 2.0 * 2.0) return { type: 'shop', label: `Vending machine (${G.wallet.pts} points)` };
    let best = null, bd = 2.4 * 2.4;
    for (const t of world.tables) { const dd = d2(P, t.x, t.z); if (dd < bd && Math.abs(P.y - t.gy) < 1.2) { bd = dd; best = t; } }
    if (best) return { type: 'collect', id: best.id, label: `Pick up “${best.word}”` };
    const climb = climbOption(); if (climb) return climb;
    if (G.settings.lockers) {
      for (const L of M.LOCKERS) if (d2(P, L.x, L.z) < 2.1 * 2.1 && Math.abs(P.y - L.y) < 1.2) return { type: 'hide', id: L.id, label: 'Hide in the locker' };
    }
  }
  if (G.role === 'seeker' && liveHead() <= 0) {
    if (G.settings.lockers) for (const L of M.LOCKERS) if (d2(P, L.x, L.z) < 2.1 * 2.1 && Math.abs(P.y - L.y) < 1.2) return { type: 'search', id: L.id, label: 'Search the locker' };
    const climb = climbOption(); if (climb) return climb;
  }
  return null;
}
// climbing over low crates / sandbags (hiders and seekers)
function climbOption() {
  if (P.vault || P.hidden !== null || G.status !== 'free') return null;
  const lv = myLevel();
  if (Math.abs(P.y - M.FLOOR_Y[lv]) > 0.05) return null;          // not on stairs
  for (const dir of [P.ry, camYaw + Math.PI]) {                    // the way you face, or the way the camera looks
    const tgt = M.climbTarget(P.x, P.z, dir, lv);
    if (tgt) return { type: 'climb', label: 'Climb over', tgt };
  }
  return null;
}
function doAction() {
  SFX.unlock();
  const a = currentAction;
  if (!G) return;
  if (!a) { if (G.wallet.taser) fireTaser(); return; }   // nothing else to do: E fires the taser
  const now = performance.now();
  if (now - lastActionAt < (a.type === 'climb' ? 120 : 300)) return;
  lastActionAt = now;
  if (a.type === 'collect') socket.emit('collect', a.id);
  else if (a.type === 'hide') socket.emit('hide', a.id);
  else if (a.type === 'unhide') socket.emit('unhide');
  else if (a.type === 'search') socket.emit('search', a.id);
  else if (a.type === 'rescue') socket.emit('rescue');
  else if (a.type === 'escape') socket.emit('escape');
  else if (a.type === 'shop') openShop();
  else if (a.type === 'climb') {
    P.vault = { t: 0, x0: P.x, z0: P.z, x1: a.tgt.x, z1: a.tgt.z, y: M.FLOOR_Y[myLevel()] };
    P.ry = Math.atan2(a.tgt.x - P.x, a.tgt.z - P.z);
    SFX.step(false);
  }
}

// ============================================================
// GAME UPDATE
// ============================================================
function updateLocal(dt) {
  if (P.vault) { // climbing over a low crate: a quick hop in an arc
    const v = P.vault;
    v.t = Math.min(1, v.t + dt / 0.55);
    const e = v.t * v.t * (3 - 2 * v.t);
    P.x = v.x0 + (v.x1 - v.x0) * e; P.z = v.z0 + (v.z1 - v.z0) * e;
    P.y = v.y + Math.sin(Math.PI * v.t) * 1.45;
    if (v.t >= 1) { P.y = v.y; P.vault = null; const c = M.collide(P.x, P.z, 0.32, myLevel()); P.x = c.x; P.z = c.z; SFX.step(false); }
    myMesh.visible = camCur > 0.7;
    myMesh.position.set(P.x, P.y, P.z); myMesh.rotation.y = P.ry;
    animateCharacter(myMesh, dt, 0.2, true);
    return;
  }
  const head = liveHead();
  const stunned = performance.now() < G.stunUntil;
  if (stunned && P.slide && P.slide.t < 0.7) { // slipping on oil: skid forward a little
    P.slide.t += dt;
    const sp = 4.5 * (1 - P.slide.t / 0.7);
    const c = M.collide(P.x + Math.sin(P.slide.dir) * sp * dt, P.z + Math.cos(P.slide.dir) * sp * dt, 0.32, myLevel());
    P.x = c.x; P.z = c.z;
  }
  const frozen = (G.role === 'seeker' && head > 0) || stunned || P.hidden !== null || G.over || overlayKind === 'pause';
  let ix = 0, iy = 0;
  if (keys.KeyW || keys.ArrowUp) iy += 1;
  if (keys.KeyS || keys.ArrowDown) iy -= 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (touch.stickId !== null) { ix += touch.x; iy -= touch.y; }
  let len = Math.hypot(ix, iy);
  if (len > 1) { ix /= len; iy /= len; len = 1; }
  if (frozen) { ix = iy = 0; len = 0; }

  const wantRun = (keys.ShiftLeft || keys.ShiftRight || P.run) && !P.crouch;
  const running = wantRun && len > 0.2 && !P.tired;
  if (running) P.stamina -= dt * 0.2; else P.stamina += dt * (len > 0 ? 0.1 : 0.16);
  P.stamina = clamp(P.stamina, 0, 1);
  if (P.stamina <= 0.01) P.tired = true;
  if (P.tired && P.stamina > 0.3) P.tired = false;

  let speed = P.crouch ? 2.3 : running ? 6.6 : 4.2;
  if (G.role === 'seeker') speed *= G.settings.seekerSpeed;
  if (len > 0) {
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    const mx = (fx * iy + rx * ix), mz = (fz * iy + rz * ix);
    const nx = P.x + mx * speed * dt, nz = P.z + mz * speed * dt;
    const c = M.collide(nx, nz, 0.32, myLevel());
    P.x = c.x; P.z = c.z;
    if (G.status === 'jailed') {
      const [x0, z0, x1, z1] = M.PRISON_RECT;
      P.x = clamp(P.x, x0 * M.CELL + 0.35, (x1 + 1) * M.CELL - 0.35); P.z = clamp(P.z, z0 * M.CELL + 0.35, (z1 + 1) * M.CELL - 0.35);
    }
    if (G.status === 'escaped') { const Y = M.YARD_RECT; P.x = clamp(P.x, Y.x0, Y.x1); P.z = clamp(P.z, Y.z0, Y.z1); }
    P.ry = lerpAngle(P.ry, Math.atan2(mx, mz), Math.min(1, dt * 12));
    P.stepT += dt * speed * len;
    if (P.stepT > 2.1) { P.stepT = 0; SFX.step(P.crouch); }
  }
  const gh = M.groundHeight(P.x, P.z, P.y);
  P.y = Math.abs(gh - P.y) > 0.6 ? gh : P.y + (gh - P.y) * Math.min(1, dt * 20);
  P.speedN += ((len * speed) / 6.6 - P.speedN) * Math.min(1, dt * 10);

  myMesh.visible = P.hidden === null && camCur > 0.7;
  myMesh.position.set(P.x, P.y, P.z);
  myMesh.rotation.y = P.ry;
  animateCharacter(myMesh, dt, P.speedN, P.crouch);
  myMesh.rotation.z = stunned ? Math.sin(performance.now() / 70) * 0.22 : 0;
}

function updateRemotes(dt) {
  const k = 1 - Math.exp(-dt * 12);
  for (const r of remotes.values()) {
    if (!r.tgt) { r.mesh.visible = false; r.beam.visible = false; continue; }
    if (!r.cur || Math.hypot(r.tgt.x - r.cur.x, r.tgt.z - r.cur.z) > 6) r.cur = { ...r.tgt };
    const px = r.cur.x, pz = r.cur.z;
    r.cur.x += (r.tgt.x - r.cur.x) * k; r.cur.y += (r.tgt.y - r.cur.y) * k; r.cur.z += (r.tgt.z - r.cur.z) * k;
    r.cur.ry = lerpAngle(r.cur.ry, r.tgt.ry, k); r.cur.aim = lerpAngle(r.cur.aim, r.tgt.aim, k);
    r.cur.pitch += (r.tgt.pitch - r.cur.pitch) * k;
    const v = Math.hypot(r.cur.x - px, r.cur.z - pz) / Math.max(dt, 0.001);
    r.speed += (Math.min(1, v / 6.6) - r.speed) * Math.min(1, dt * 8);
    const vis = r.seen && !(r.flags & 16);
    r.mesh.visible = vis;
    r.mesh.position.set(r.cur.x, r.cur.y, r.cur.z);
    r.mesh.rotation.y = r.cur.ry;
    if (vis) animateCharacter(r.mesh, dt, r.speed, !!(r.flags & 1));
    r.mesh.rotation.z = (r.flags & 32) ? Math.sin(performance.now() / 70) * 0.22 : 0;
    r.ring.visible = r.role === 'seeker';
    const near = Math.hypot(r.cur.x - P.x, r.cur.z - P.z) < 2.6;
    r.tag.visible = vis && !near && M.levelOfY(r.cur.y) === myLevel() && (G.role !== 'seeker' || r.role === 'seeker');
    r.beam.visible = vis && !!(r.flags & 8);
    if (r.beam.visible) {
      r.beam.position.set(r.cur.x + Math.sin(r.cur.aim) * 0.3, r.cur.y + 1.3 - (r.flags & 1 ? 0.45 : 0), r.cur.z + Math.cos(r.cur.aim) * 0.3);
      r.beam.rotation.set(-r.cur.pitch, r.cur.aim, 0, 'YXZ');
    }
  }
}

function cameraBlocked(x, y, z, lv) {
  const [cx, cz] = M.cellOf(x, z);
  const ch = M.glyph(cx, cz, lv);
  if (ch === 'v') { // inside a stairwell: free between the steps and the ground-floor ceiling
    const st = M.stairAt(cx, cz);
    return !st || y < M.stairHeight(st, z) + 0.25 || y > M.CEIL[0] - 0.2;
  }
  if (M.TALL.has(ch)) return true;
  if (y < M.FLOOR_Y[lv] + 0.2) return true;
  if (y > M.CEIL[lv] - 0.2 && !(lv === 0 && cz < 3)) return true;
  return false;
}
function updateCamera(dt) {
  let tx = P.x, tz = P.z, ty = P.y + (P.crouch ? 1.15 : 1.55);
  const lv = myLevel();
  if (P.hidden !== null) {
    const L = M.LOCKERS[P.hidden];
    tx = L.x + L.face[0] * 0.9; tz = L.z + L.face[1] * 0.9; ty = L.y + 1.55;
  }
  const cp = Math.cos(camPitch), dx = Math.sin(camYaw) * cp, dy = Math.sin(camPitch), dz = Math.cos(camYaw) * cp;
  let d = 0.4;
  while (d < camDist) {
    if (cameraBlocked(tx + dx * d, ty + dy * d, tz + dz * d, lv)) { d = Math.max(0.35, d - 0.3); break; }
    d += 0.15;
  }
  d = Math.min(d, camDist);
  camCur += (d - camCur) * Math.min(1, dt * (d < camCur ? 18 : 4));
  camera.position.set(tx + dx * camCur, ty + dy * camCur, tz + dz * camCur);
  camera.lookAt(tx, ty + 0.15, tz);
}
function updateTorch() {
  const aim = camYaw + Math.PI;
  const pitch = -camPitch * 0.75 + 0.05;
  const on = G && P.torch && P.hidden === null && !(G.role === 'seeker' && liveHead() > 0);
  torch.intensity = on ? (G.role === 'seeker' ? 55 : 42) : 0;
  torch.position.set(P.x + Math.sin(aim) * 0.35, P.y + (P.crouch ? 0.9 : 1.35), P.z + Math.cos(aim) * 0.35);
  torch.target.position.set(
    torch.position.x + Math.sin(aim) * Math.cos(pitch) * 6,
    torch.position.y + Math.sin(pitch) * 6,
    torch.position.z + Math.cos(aim) * Math.cos(pitch) * 6);
  return { aim, pitch };
}

let netT = 0, mmT = 0;
function sendState(aim, pitch) {
  if (!G || G.status === 'waiting' || P.hidden !== null) return;
  const moving = P.speedN > 0.05;
  const flags = (P.crouch || P.vault ? 1 : 0) | (moving || P.vault ? 2 : 0) | (P.speedN > 0.75 ? 4 : 0) | (torch.intensity > 0 ? 8 : 0);
  socket.volatile.emit('s', [r2(P.x), r2(P.y), r2(P.z), r2(P.ry), r2(aim), r2(pitch), flags]);
}

function fmtTime(ms) { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
let lastPromptKey = '';
function updateHUD(t, dt) {
  const head = liveHead();
  const time = liveTime() - Math.max(0, head); // round clock starts after the seeker's count
  const tEl = $('#timer');
  const txt = fmtTime(Math.max(0, time));
  if (tEl.textContent !== txt) tEl.textContent = txt;
  tEl.classList.toggle('low', head <= 0 && time < 30000);
  // last 10 seconds tick
  const sec = Math.ceil(time / 1000);
  if (head <= 0 && sec <= 10 && sec !== G.lastTick && !G.over) { G.lastTick = sec; SFX.tick(); }

  // head start
  if (head > 0) {
    const n = Math.ceil(head / 1000);
    $('#countNum').textContent = n;
    $('#headBanner').textContent = `Hide! The seeker starts in ${n}`;
  } else if (!G.headAnnounced) {
    G.headAnnounced = true;
    $('#blackout').classList.add('hidden'); $('#headBanner').classList.add('hidden');
    if (G.mode !== 'practice') {
      SFX.go();
      if (G.role === 'seeker') bigMsg('Ready or not…', 'Here I come!'); else toast('The seeker is hunting!', 'bad');
    }
  }

  // action prompt
  currentAction = computeAction();
  world.highlightTable(currentAction && currentAction.type === 'collect' ? currentAction.id : -1);
  const key = currentAction ? currentAction.type + currentAction.label : '';
  if (key !== lastPromptKey) {
    lastPromptKey = key;
    const pr = $('#prompt');
    pr.classList.toggle('hidden', !currentAction);
    if (currentAction) pr.innerHTML = `<kbd>${isTouch ? 'Action' : 'E'}</kbd>${esc(currentAction.label)}`;
    $('#tAct').classList.toggle('idle', !currentAction);
  }

  // stamina + hide bar
  $('#stamina div').style.width = (P.stamina * 100) + '%';
  $('#stamina').style.opacity = P.stamina < 0.99 ? 1 : 0;
  const hb = $('#hideBar');
  hb.classList.toggle('hidden', P.hidden === null);
  if (P.hidden !== null) {
    const max = G.settings.lockerTime * 1000;
    hb.firstElementChild.style.width = clamp((P.hideUntil - performance.now()) / max, 0, 1) * 100 + '%';
  }
  if (G.role === 'seeker') {
    const el = $('#pingIn');
    if (el) el.textContent = G.nextPingIn >= 0 && head <= 0 ? `Next ping: ${Math.ceil(Math.max(0, G.nextPingIn - (performance.now() - G.lastSnap)) / 1000)}s` : '';
  }
  updateArrows();
  updateNearWarning(dt);
  const stunLeft = G.stunUntil - performance.now();
  const sm = $('#stunMsg');
  sm.classList.toggle('hidden', stunLeft <= 0);
  if (stunLeft > 0) sm.textContent = `${G.stunKind === 'oil' ? 'SLIPPING!' : 'ZAPPED!'} ${Math.ceil(stunLeft / 1000)}`;
  $('#crosshair').classList.toggle('hidden', !(G.role === 'hider' && G.status === 'free' && G.wallet.taser && P.hidden === null));
  if (overlayKind === 'shop' && !M.VENDING.some(v => v.floor === myLevel() && d2(P, v.use.x, v.use.z) < 3.2 * 3.2)) hideOverlay();
}

// ---------- "Seeker is near" warning for hiders ----------
function updateNearWarning(dt) {
  const range = G.settings.nearWarn || 0;
  let closest = Infinity, target = null;
  if (G.role === 'hider' && G.status === 'free' && range > 0 && liveHead() <= 0 && !G.over) {
    for (const r of remotes.values()) {
      if (r.role !== 'seeker' || !r.cur || !r.seen) continue;
      if (M.levelOfY(r.cur.y) !== myLevel()) continue; // a floor in between = safe
      const d = Math.hypot(r.cur.x - P.x, r.cur.z - P.z);
      if (d < closest) { closest = d; target = r.cur; }
    }
  }
  const on = closest <= range;
  const k = on ? clamp(1 - closest / range, 0, 1) : 0;      // 0 = edge of range, 1 = right next to you
  G.near = k;
  const el = $('#nearWarn');
  el.classList.toggle('hidden', !on);
  if (on) {
    const veryClose = closest < range * 0.45;
    const txt = veryClose ? 'SEEKER IS VERY CLOSE – HIDE!' : 'SEEKER IS NEAR!';
    if (el.textContent !== txt) el.textContent = txt;
    el.classList.toggle('close', veryClose);
    // glow on the side of the screen the seeker is coming from
    const rel = Math.atan2(target.x - P.x, target.z - P.z) - (camYaw + Math.PI), sAng = -rel;
    const base = 0.35 + 0.65 * k;
    $('#edgeL').style.opacity = (Math.max(0, -Math.sin(sAng)) * base).toFixed(2);
    $('#edgeR').style.opacity = (Math.max(0, Math.sin(sAng)) * base).toFixed(2);
    $('#edgeT').style.opacity = (Math.max(0, Math.cos(sAng)) * base).toFixed(2);
    $('#edgeB').style.opacity = (Math.max(0, -Math.cos(sAng)) * base).toFixed(2);
    G.beatT -= dt;
    if (G.beatT <= 0) { SFX.heartbeat(); G.beatT = 1.0 - 0.6 * k; }
  } else {
    for (const id of ['#edgeL', '#edgeR', '#edgeT', '#edgeB']) $(id).style.opacity = 0;
  }
}

// ============================================================
// MAIN LOOP
// ============================================================
let lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const t = now / 1000;
  world.update(dt, t);
  if (screen === 'game' && G) {
    updateLocal(dt);
    updateRemotes(dt);
    updateCamera(dt);
    const { aim, pitch } = updateTorch();
    updateHUD(t, dt);
    updatePillars();
    netT += dt; if (netT >= 0.066) { netT = 0; sendState(aim, pitch); }
    mmT += dt; if (mmT >= 0.1) { mmT = 0; drawMinimap(t); }
  } else {
    const a = Math.sin(t * 0.12) * 0.35;
    camera.position.set(M.EXIT_POINT.x, 2.0, M.EXIT_POINT.z + 0.6);
    camera.lookAt(M.EXIT_POINT.x + Math.sin(a) * 6, 1.2, M.EXIT_POINT.z + Math.cos(a) * 6);
    torch.intensity = 30;
    torch.position.copy(camera.position);
    torch.target.position.set(M.EXIT_POINT.x + Math.sin(a) * 6, 1.0, M.EXIT_POINT.z + Math.cos(a) * 6);
    renderPreview(dt);
  }
  renderer.render(scene, camera);
}

// ---------- boot ----------
buildLookUI();
buildSettingsForm();
initPreview();
showScreen('menu');
requestAnimationFrame(loop);
