// Escape Warehouse – procedural, customisable characters (boy / girl / robot + outfits).
import * as THREE from 'three';
import { DEFAULT_LOOK } from '../shared/settings.js';

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10);

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

// Model faces +Z. Feet at y = 0. Height ≈ 1.72 m.
export function buildCharacter(lookIn) {
  const look = { ...DEFAULT_LOOK, ...(lookIn || {}) };
  const robot = look.body === 'robot', girl = look.body === 'girl';
  let skin = look.skin, top = look.shirt, bottom = look.pants, shoe = '#2a2a2e';
  let longSleeves = false, shorts = false, dress = false, hood = false, ninja = false, explorer = false, stripe = false;
  switch (look.outfit) {
    case 'hoodie': longSleeves = true; hood = true; break;
    case 'dress': dress = true; break;
    case 'sporty': shorts = true; stripe = true; shoe = '#f2f2f2'; break;
    case 'explorer': top = '#c9b07a'; bottom = '#6e5434'; shoe = '#4a3220'; explorer = true; break;
    case 'ninja': top = '#1d1d24'; bottom = '#1d1d24'; shoe = '#111114'; longSleeves = true; ninja = true; break;
  }
  if (robot) skin = '#b9c3cc';

  const M = {
    skin: lam(skin), top: lam(top), bottom: lam(bottom), shoe: lam(shoe), hair: lam(look.hair),
    dark: lam('#111111'), white: lam('#ffffff'), red: lam('#c8102e'),
    metal: lam('#8d99a5'), glow: new THREE.MeshBasicMaterial({ color: '#4ff3ff' }),
    gold: lam('#f2c230', { emissive: '#5a4000' }), cheek: lam('#ff9a9a'),
  };

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const parts = {};

  // --- legs (hip → knee pivots) ---
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.1 * side, 0.82, 0); body.add(hip);
    hip.add(mesh(cap(0.078, 0.28), robot ? M.metal : M.bottom, 0, -0.2, 0));
    const knee = new THREE.Group(); knee.position.y = -0.41; hip.add(knee);
    const shinMat = robot ? M.metal : (shorts || dress) ? M.skin : M.bottom;
    knee.add(mesh(cap(0.066, 0.28), shinMat, 0, -0.19, 0));
    const foot = mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), M.shoe, 0, -0.38, 0.04);
    knee.add(foot);
    parts[side < 0 ? 'legL' : 'legR'] = hip;
    parts[side < 0 ? 'kneeL' : 'kneeR'] = knee;
  }
  if (dress) {
    const skirt = mesh(new THREE.CylinderGeometry(0.17, 0.33, 0.42, 16, 1, true), lam(top, { side: THREE.DoubleSide }), 0, 0.72, 0);
    body.add(skirt);
  }

  // --- torso ---
  const torsoMat = robot ? M.metal : M.top;
  const torso = mesh(cap(0.19, 0.24), torsoMat, 0, 1.1, 0);
  torso.scale.set(girl ? 1.0 : 1.12, 1, 0.78);
  body.add(torso);
  // hips: wider than the bottom of the torso so the shirt never pokes through the trousers
  const hips = mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.17, 16), robot ? M.metal : (dress ? M.top : M.bottom), 0, 0.885, 0);
  hips.scale.set(1.17, 1, 0.86); body.add(hips);
  if (stripe) { const s = mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.06, 16), M.white, 0, 1.12, 0); s.scale.set(1.12, 1, 0.8); body.add(s); }
  if (ninja) { const belt = mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 18), M.red, 0, 0.93, 0); belt.rotation.x = Math.PI / 2; belt.scale.set(1.08, 0.8, 1); body.add(belt); }
  if (explorer) { const strap = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), lam('#4a3220'), 0.02, 1.12, 0.15); strap.rotation.z = 0.7; body.add(strap); }
  if (robot) {
    body.add(mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), M.glow, 0, 1.15, 0.16));
  }

  // --- arms (shoulder → elbow pivots) ---
  for (const side of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.26 * side * (girl ? 0.95 : 1), 1.33, 0); body.add(sh);
    sh.add(mesh(cap(0.058, 0.2), robot ? M.metal : M.top, 0, -0.14, 0));
    const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
    el.add(mesh(cap(0.052, 0.18), robot ? M.metal : (longSleeves ? M.top : M.skin), 0, -0.12, 0));
    el.add(mesh(new THREE.SphereGeometry(0.058, 10, 8), robot ? M.dark : M.skin, 0, -0.27, 0));
    sh.rotation.z = 0.08 * side;
    parts[side < 0 ? 'armL' : 'armR'] = sh;
    parts[side < 0 ? 'elbowL' : 'elbowR'] = el;
  }

  // --- head ---
  const head = new THREE.Group(); head.position.y = 1.53; body.add(head);
  parts.head = head;
  if (robot) {
    head.add(mesh(new THREE.BoxGeometry(0.36, 0.32, 0.32), M.metal));
    head.add(mesh(new THREE.BoxGeometry(0.28, 0.1, 0.02), M.dark, 0, 0.02, 0.165));
    head.add(mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), M.glow, -0.07, 0.02, 0.176));
    head.add(mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), M.glow, 0.07, 0.02, 0.176));
    head.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16), M.dark, 0, 0.24, 0));
    head.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), lam('#ff3b3b', { emissive: '#aa0000' }), 0, 0.33, 0));
  } else {
    head.add(mesh(new THREE.SphereGeometry(0.2, 20, 16), M.skin));
    for (const sx of [-0.07, 0.07]) {
      head.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), M.dark, sx, 0.02, 0.18));
      head.add(mesh(new THREE.SphereGeometry(0.009, 6, 4), M.white, sx + 0.01, 0.035, 0.205));
      if (girl) { const lash = mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), M.dark, sx + 0.012 * Math.sign(sx), 0.055, 0.185); lash.rotation.z = -0.4 * Math.sign(sx); head.add(lash); }
    }
    if (!ninja) {
      head.add(mesh(new THREE.BoxGeometry(0.07, 0.014, 0.01), lam('#7a2c2c'), 0, -0.07, 0.19));
      for (const sx of [-0.11, 0.11]) { const c = mesh(new THREE.SphereGeometry(0.03, 8, 6), M.cheek, sx, -0.04, 0.15); c.scale.z = 0.4; head.add(c); }
    } else {
      const mask = mesh(new THREE.CylinderGeometry(0.207, 0.207, 0.15, 18, 1, true), lam('#1d1d24', { side: THREE.DoubleSide }), 0, -0.07, 0);
      head.add(mask);
    }
    // hair (styles are shaped so they never poke through clothes, hoods or hats)
    const hs = ninja ? 'none' : look.hairStyle;
    const bigHat = ['cap', 'beanie'].includes(look.hat) || explorer;
    if (hs !== 'none') {
      const capG = new THREE.SphereGeometry(0.214, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
      const hcap = mesh(capG, M.hair, 0, 0.012, -0.01); hcap.rotation.x = -0.28; head.add(hcap);
      if (hs === 'long' && !hood) {
        // curved shell behind the head that stops above the shoulders and clears the arms
        const back = mesh(new THREE.CylinderGeometry(0.214, 0.24, 0.3, 18, 1, true, Math.PI / 2 + 0.5, Math.PI - 1.0),
          lam(look.hair, { side: THREE.DoubleSide }), 0, -0.15, -0.012);
        head.add(back);
      } else if (hs === 'ponytail' && !hood) {
        const pt = mesh(cap(0.055, 0.16), M.hair, 0, -0.06, -0.26); pt.rotation.x = 0.35; head.add(pt);
        head.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), M.red, 0, 0.04, -0.215));
      } else if (hs === 'bun' && !hood) {
        if (bigHat) head.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), M.hair, 0, -0.02, -0.235)); // low bun under the hat
        else head.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), M.hair, 0, 0.2, -0.07));
      } else if (hs === 'spiky' && !bigHat && !hood) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const sp = mesh(new THREE.ConeGeometry(0.05, 0.14, 6), M.hair, Math.cos(a) * 0.1, 0.18, Math.sin(a) * 0.1 - 0.02);
          sp.rotation.z = -Math.cos(a) * 0.6; sp.rotation.x = Math.sin(a) * 0.6; head.add(sp);
        }
      }
    }
    if (hood) {
      // gap of the hood faces forward (+Z) so the face stays visible
      // big enough to enclose any hair cap (hair radius 0.214 + its offset)
      const hd = mesh(new THREE.SphereGeometry(0.255, 18, 12, Math.PI * 0.68, Math.PI * 1.64, 0, Math.PI * 0.7), lam(top, { side: THREE.DoubleSide }), 0, 0.005, -0.02);
      head.add(hd);
    }
    if (ninja) {
      const band = mesh(new THREE.TorusGeometry(0.205, 0.022, 6, 20), M.red, 0, 0.09, 0); band.rotation.x = Math.PI / 2 + 0.15; head.add(band);
      const tail = mesh(new THREE.BoxGeometry(0.05, 0.22, 0.02), M.red, 0.04, -0.02, -0.22); tail.rotation.z = 0.4; head.add(tail);
    }
  }
  // hats – in their own group so they can sit on a robot's box head or over a hood
  const hat = explorer ? 'explorer' : look.hat;
  const hatMat = lam(look.shirt === look.pants ? '#e63946' : look.pants);
  const hatG = new THREE.Group();
  hatG.position.y = robot ? 0.13 : 0;
  if (hood && !robot) { hatG.scale.setScalar(1.2); hatG.position.y = 0.01; }
  head.add(hatG);
  if (hat === 'cap') {
    hatG.add(mesh(new THREE.SphereGeometry(0.222, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), hatMat, 0, 0.03, 0));
    hatG.add(mesh(new THREE.BoxGeometry(0.25, 0.025, 0.17), hatMat, 0, 0.1, 0.2));
  } else if (hat === 'beanie') {
    hatG.add(mesh(new THREE.SphereGeometry(0.226, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), hatMat, 0, 0.02, 0));
    hatG.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), M.white, 0, 0.25, 0));
  } else if (hat === 'bow') {
    for (const s2 of [-1, 1]) { const b = mesh(new THREE.ConeGeometry(0.06, 0.12, 8), lam('#ff5fa2'), 0.15 + s2 * 0.06, 0.17, 0); b.rotation.z = s2 * Math.PI / 2; hatG.add(b); }
  } else if (hat === 'crown') {
    hatG.add(mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.09, 12, 1, true), M.gold, 0, 0.21, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; hatG.add(mesh(new THREE.ConeGeometry(0.03, 0.08, 6), M.gold, Math.cos(a) * 0.14, 0.29, Math.sin(a) * 0.14)); }
  } else if (hat === 'headband') {
    const hb = mesh(new THREE.TorusGeometry(robot ? 0.262 : 0.207, 0.022, 6, 20), hatMat, 0, robot ? -0.06 : 0.1, 0); hb.rotation.x = Math.PI / 2 + (robot ? 0 : 0.2); hatG.add(hb);
  } else if (hat === 'explorer') {
    hatG.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.025, 20), lam('#a88c55'), 0, 0.12, 0));
    hatG.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.14, 16), lam('#a88c55'), 0, 0.2, 0));
    hatG.add(mesh(new THREE.CylinderGeometry(0.202, 0.202, 0.03, 16), lam('#5a3e22'), 0, 0.15, 0));
  }

  root.traverse(o => { if (o.isMesh) o.castShadow = false; });
  root.userData = { parts, body, phase: Math.random() * 6, cr: 0 };
  return root;
}

// speed: 0..1 (1 = running), crouch: boolean
export function animateCharacter(char, dt, speed, crouch) {
  const u = char.userData, p = u.parts;
  const moving = speed > 0.04;
  u.phase += dt * (5 + speed * 7) * (moving ? 1 : 0.25);
  u.cr += ((crouch ? 1 : 0) - u.cr) * Math.min(1, dt * 10);
  const amp = Math.min(1, speed * 1.5);
  const sw = Math.sin(u.phase) * 0.7 * amp;
  const cr = u.cr;
  p.legL.rotation.x = sw - cr * 1.15;
  p.legR.rotation.x = -sw - cr * 1.15;
  p.kneeL.rotation.x = Math.max(0, -Math.sin(u.phase)) * 0.9 * amp + cr * 1.85;
  p.kneeR.rotation.x = Math.max(0, Math.sin(u.phase)) * 0.9 * amp + cr * 1.85;
  p.armL.rotation.x = -sw * 0.9 - cr * 0.5;
  p.armR.rotation.x = sw * 0.9 - cr * 0.5;
  p.elbowL.rotation.x = -0.25 - amp * 0.4 - cr * 0.6;
  p.elbowR.rotation.x = -0.25 - amp * 0.4 - cr * 0.6;
  const breathe = moving ? 0 : Math.sin(u.phase * 2) * 0.008;
  u.body.position.y = -cr * 0.36 + Math.abs(Math.sin(u.phase)) * 0.045 * amp + breathe;
  u.body.rotation.x = cr * 0.28 + amp * 0.08;
  p.head.rotation.x = -cr * 0.2;
}
