// Escape Warehouse – builds the 3D warehouse from the shared map grid.
import * as THREE from 'three';
import * as M from '../shared/map.js';
import { TYPES } from '../shared/words.js';

function seeded(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  return t;
}
function speckle(g, x, y, w, h, n, r, cols) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    g.fillRect(x + r() * w, y + r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
  }
}

// ---------- procedural textures (stone, brick, wood – like the reference) ----------
function makeTextures() {
  const floor = canvasTex(256, 256, (g, w, h) => {
    const r = seeded(11);
    g.fillStyle = '#2b2925'; g.fillRect(0, 0, w, h);
    const slabs = [[0, 0, 128, 128], [128, 0, 128, 128], [0, 128, 128, 128], [128, 128, 128, 128]];
    for (const [x, y, sw, sh] of slabs) {
      const v = 92 + r() * 30;
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
      g.fillRect(x + 3, y + 3, sw - 6, sh - 6);
      speckle(g, x + 3, y + 3, sw - 6, sh - 6, 380, r, ['rgba(0,0,0,0.18)', 'rgba(255,255,255,0.08)', 'rgba(60,50,40,0.25)']);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x + 10 + r() * 40, y + 10); g.lineTo(x + 30 + r() * 60, y + 40 + r() * 50); g.stroke();
    }
  });
  const brick = canvasTex(256, 256, (g, w, h) => {
    const r = seeded(23);
    g.fillStyle = '#3b3530'; g.fillRect(0, 0, w, h);
    const bh = 32, bw = 64;
    for (let row = 0; row < h / bh; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col < w / bw + 1; col++) {
        const v = 95 + r() * 40;
        g.fillStyle = `rgb(${v},${v - 8},${v - 18})`;
        g.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
        speckle(g, col * bw + off + 2, row * bh + 2, bw - 4, bh - 4, 40, r, ['rgba(0,0,0,0.2)', 'rgba(255,255,255,0.07)']);
      }
    }
  }, [1, 3.3]);
  const crate = canvasTex(256, 256, (g, w, h) => {
    const r = seeded(37);
    g.fillStyle = '#8a6238'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 42) {
      const v = 120 + r() * 30;
      g.fillStyle = `rgb(${v},${v * 0.68},${v * 0.38})`;
      g.fillRect(0, y + 2, w, 38);
      g.strokeStyle = 'rgba(60,35,15,0.35)';
      for (let k = 0; k < 6; k++) { g.beginPath(); const yy = y + 6 + r() * 30; g.moveTo(0, yy); g.bezierCurveTo(80, yy + 3, 170, yy - 3, w, yy); g.stroke(); }
    }
    g.fillStyle = '#5a3a1e';
    g.fillRect(0, 0, w, 24); g.fillRect(0, h - 24, w, 24); g.fillRect(0, 0, 24, h); g.fillRect(w - 24, 0, 24, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 4); g.fillRect(-180, -11, 360, 22); g.restore();
    g.fillStyle = '#2a1a0c';
    for (const [x, y] of [[12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  });
  const cardboard = canvasTex(128, 128, (g, w, h) => {
    const r = seeded(41);
    g.fillStyle = '#a3804f'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 200, r, ['rgba(0,0,0,0.1)', 'rgba(255,255,255,0.06)']);
    g.fillStyle = 'rgba(200,180,140,0.55)'; g.fillRect(w / 2 - 8, 0, 16, h);
  });
  const sandbag = canvasTex(128, 64, (g, w, h) => {
    const r = seeded(53);
    g.fillStyle = '#9c8a62'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 260, r, ['rgba(0,0,0,0.15)', 'rgba(255,255,230,0.12)']);
    g.strokeStyle = 'rgba(70,55,30,0.6)'; g.setLineDash([4, 4]);
    g.beginPath(); g.moveTo(6, 4); g.lineTo(6, h - 4); g.moveTo(w - 6, 4); g.lineTo(w - 6, h - 4); g.stroke();
  });
  const grass = canvasTex(128, 128, (g, w, h) => {
    const r = seeded(61);
    g.fillStyle = '#26331f'; g.fillRect(0, 0, w, h);
    speckle(g, 0, 0, w, h, 900, r, ['#2f4426', '#1c2617', '#3b5230', '#47423a']);
  });
  const straw = canvasTex(128, 128, (g, w, h) => {
    const r = seeded(71);
    g.fillStyle = '#4a3b28'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8f7442'; g.lineWidth = 1.2;
    for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h, a = r() * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke(); }
  });
  const locker = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#4c6a63'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2b3d39';
    for (let i = 0; i < 6; i++) g.fillRect(28, 20 + i * 12, 72, 5);
    for (let i = 0; i < 6; i++) g.fillRect(28, 180 + i * 12, 72, 5);
    g.fillStyle = '#c9c9c9'; g.fillRect(96, 118, 10, 26);
    g.strokeStyle = '#33473f'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
  return { floor, brick, crate, cardboard, sandbag, grass, straw, locker };
}

function textCanvasTex(lines, opts = {}) {
  const w = opts.w || 512, h = opts.h || 128;
  return canvasTex(w, h, (g) => {
    g.fillStyle = opts.bg || '#111'; g.fillRect(0, 0, w, h);
    g.strokeStyle = opts.border || '#fff'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((ln, i) => {
      g.fillStyle = ln.color || '#fff';
      g.font = `${ln.weight || 900} ${ln.size}px "Bungee", "Nunito", system-ui, sans-serif`;
      g.fillText(ln.text, w / 2, h * (n === 1 ? 0.54 : (i === 0 ? 0.38 : 0.76)));
    });
  });
}

export function buildWorld(scene) {
  const T = makeTextures();
  scene.background = new THREE.Color(0x020203);
  scene.fog = new THREE.FogExp2(0x020203, 0.07);
  const root = new THREE.Group();
  scene.add(root);
  const rand = seeded(1234);
  const C = M.CELL, K = C / 2; // K scales props that were designed for 2 m cells

  const mat = {
    floor: new THREE.MeshLambertMaterial({ map: T.floor }),
    floorDark: new THREE.MeshLambertMaterial({ map: T.floor, color: 0x8a8a90 }),
    wall: new THREE.MeshLambertMaterial({ map: T.brick }),
    crate: new THREE.MeshLambertMaterial({ map: T.crate }),
    crateDark: new THREE.MeshLambertMaterial({ map: T.crate, color: 0xb59a80 }),
    cardboard: new THREE.MeshLambertMaterial({ map: T.cardboard }),
    sandbag: new THREE.MeshLambertMaterial({ map: T.sandbag }),
    grass: new THREE.MeshLambertMaterial({ map: T.grass }),
    straw: new THREE.MeshLambertMaterial({ map: T.straw }),
    post: new THREE.MeshLambertMaterial({ color: 0x2f4f78 }),
    beam: new THREE.MeshLambertMaterial({ color: 0xc8682a }),
    board: new THREE.MeshLambertMaterial({ color: 0x5d4b38 }),
    backing: new THREE.MeshLambertMaterial({ color: 0x3b3328 }),
    iron: new THREE.MeshLambertMaterial({ color: 0x3a3a40 }),
    rust: new THREE.MeshLambertMaterial({ color: 0x7a3a28 }),
    rail: new THREE.MeshLambertMaterial({ color: 0xd9b92e }),
    wood: new THREE.MeshLambertMaterial({ color: 0x6b4a2c }),
    step: new THREE.MeshLambertMaterial({ color: 0x55504a }),
    stripe: new THREE.MeshLambertMaterial({ color: 0xd9b92e, emissive: 0x3a3000 }),
    barrel: new THREE.MeshLambertMaterial({ color: 0x6e4d2d }),
    ceiling: new THREE.MeshLambertMaterial({ color: 0x15130f, side: THREE.DoubleSide }),
    pipe: new THREE.MeshLambertMaterial({ color: 0x556060 }),
    fence: new THREE.MeshLambertMaterial({ color: 0x4a4a4a }),
  };
  const roomMat = {};
  for (const k in M.ROOMS) roomMat[k] = new THREE.MeshLambertMaterial({ color: M.ROOMS[k].color, emissive: M.ROOMS[k].color, emissiveIntensity: 0.5 });

  const G = {
    unit: new THREE.BoxGeometry(1, 1, 1),
    tile: new THREE.PlaneGeometry(C, C),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
    barrel: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
    sphere: new THREE.SphereGeometry(1, 10, 8),
  };

  // ---------- instanced batching ----------
  const batches = new Map();
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  function put(geom, material, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, order = 'XYZ') {
    const key = geom.uuid + material.uuid;
    let b = batches.get(key);
    if (!b) { b = { geom, material, list: [] }; batches.set(key, b); }
    _e.set(rx, ry, rz, order); _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
    b.list.push(_m.clone());
  }
  function boxLocal(material, cx, cy, cz, alongZ, lx, ly, lz, sx, sy, sz, ry = 0) {
    if (alongZ) put(G.unit, material, cx + lz, cy + ly, cz + lx, sz, sy, sx, 0, ry);
    else put(G.unit, material, cx + lx, cy + ly, cz + lz, sx, sy, sz, 0, ry);
  }

  const W = M.W, H = M.H;
  for (let level = 0; level < 2; level++) {
    const base = M.FLOOR_Y[level], ceil = M.CEIL[level];
    const isG = (cx, cz, set) => set.includes(M.glyph(cx, cz, level));
    for (let cz = 0; cz < H; cz++) {
      for (let cx = 0; cx < W; cx++) {
        const g = M.glyph(cx, cz, level);
        if (g === ' ') continue;
        const x = cx * C + C / 2, z = cz * C + C / 2;

        // ----- floor tiles + basement ceiling (underside of the ground floor) -----
        if (g === 'o' || g === 'f') put(G.tile, mat.grass, x, base, z, 1, 1, 1, -Math.PI / 2);
        else if (g === 'P') put(G.tile, mat.straw, x, base + 0.002, z, 1, 1, 1, -Math.PI / 2);
        else if (g !== '#' && g !== 'E' && g !== 'v') put(G.tile, level === 0 ? mat.floor : mat.floorDark, x, base, z, 1, 1, 1, -Math.PI / 2);
        if (level === 1 && g !== 'v') put(G.tile, mat.ceiling, x, M.CEIL[1], z, 1, 1, 1, Math.PI / 2);

        switch (g) {
          case '#': {
            const bottom = level === 0 ? M.CEIL[1] : base, top = ceil;
            put(G.unit, mat.wall, x, (bottom + top) / 2, z, C, top - bottom, C);
            break;
          }
          case 'E': put(G.unit, mat.wall, x, (base + 3.4 + ceil) / 2, z, C, ceil - base - 3.4, C); break; // wall above the exit door
          case 'f': {
            put(G.unit, mat.fence, x, base + 1.1, z, 0.12, 2.2, 0.12);
            const alongZ = isG(cx, cz - 1, ['f']) || isG(cx, cz + 1, ['f']);
            const alongX = isG(cx - 1, cz, ['f']) || isG(cx + 1, cz, ['f']);
            for (const hy of [0.5, 1.2, 1.9]) {
              if (alongX) put(G.unit, mat.fence, x, base + hy, z, C, 0.05, 0.05);
              if (alongZ) put(G.unit, mat.fence, x, base + hy, z, 0.05, 0.05, C);
            }
            break;
          }
          case 'S': {
            // full-height rack with a solid back panel: you can NOT see through or over it
            const alongZ = !(isG(cx - 1, cz, ['S']) || isG(cx + 1, cz, ['S'])) && (isG(cx, cz - 1, ['S']) || isG(cx, cz + 1, ['S']));
            const L = C * 0.995, D = C * 0.86, Ht = ceil - base - 0.02;
            for (const lx of [-L / 2 + 0.04, L / 2 - 0.04]) for (const lz of [-D / 2 + 0.04, D / 2 - 0.04]) {
              boxLocal(mat.post, x, base, z, alongZ, lx, Ht / 2, lz, 0.07, Ht, 0.07);
            }
            boxLocal(mat.backing, x, base, z, alongZ, 0, Ht / 2, 0, L, Ht, 0.06);
            for (const ly of [0.14, 1.12, 2.1, 3.08]) {
              boxLocal(mat.beam, x, base, z, alongZ, 0, ly, D / 2 - 0.04, L, 0.09, 0.05);
              boxLocal(mat.beam, x, base, z, alongZ, 0, ly, -D / 2 + 0.04, L, 0.09, 0.05);
              boxLocal(mat.board, x, base, z, alongZ, 0, ly + 0.05, 0, L - 0.04, 0.035, D - 0.08);
            }
            for (const ly of [0.19, 1.17, 2.15, 3.13]) {
              for (const side of [-1, 1]) {
                let lx = -L / 2 + 0.1;
                while (lx < L / 2 - 0.3) {
                  const bw = 0.28 + rand() * 0.3, bh = 0.32 + rand() * 0.5, bd = 0.22 + rand() * 0.14;
                  if (rand() < 0.85) boxLocal(rand() < 0.55 ? mat.cardboard : mat.crate, x, base, z, alongZ, lx + bw / 2, ly + bh / 2 + 0.03, side * (0.06 + bd / 2), bw, bh, bd, (rand() - 0.5) * 0.15);
                  lx += bw + 0.04 + rand() * 0.08;
                }
              }
            }
            break;
          }
          case 'c':
            if (rand() < 0.28) {
              put(G.barrel, mat.barrel, x - 0.32, base + 0.6, z - 0.22, 0.8, 1.2, 0.8);
              put(G.barrel, mat.barrel, x + 0.34, base + 0.6, z + 0.28, 0.8, 1.2, 0.8);
              put(G.unit, mat.iron, x - 0.32, base + 0.9, z - 0.22, 0.83, 0.05, 0.83);
            } else {
              put(G.unit, mat.crate, x, base + 0.6, z, 1.45, 1.2, 1.45, 0, (rand() - 0.5) * 0.25);
            }
            break;
          case 'C': // three-high stack – blocks sight
            put(G.unit, mat.crate, x, base + 0.66, z, 1.55, 1.32, 1.55, 0, (rand() - 0.5) * 0.1);
            put(G.unit, mat.crateDark, x, base + 1.92, z, 1.4, 1.2, 1.4, 0, (rand() - 0.5) * 0.4);
            put(G.unit, mat.crate, x, base + 3.02, z, 1.3, 1.0, 1.3, 0, rand() * 0.6);
            break;
          case 'b': {
            const alongZ = isG(cx, cz - 1, ['b']) || isG(cx, cz + 1, ['b']);
            for (let layer = 0; layer < 3; layer++) for (let k = -1; k <= 1; k++) for (const lz of [-0.3, 0.3]) {
              const lx = (k * 0.6 + (layer % 2 ? 0.3 : 0)) * K;
              if (Math.abs(lx) > 0.78) continue;
              put(G.sphere, mat.sandbag, alongZ ? x + lz : x + lx, base + 0.17 + layer * 0.31, alongZ ? z + lx : z + lz, 0.3, 0.17, 0.3);
            }
            break;
          }
          case 'w':
            put(G.unit, mat.wood, x, base + 0.85, z, 1.3, 0.08, 1.0);
            for (const lx of [-0.58, 0.58]) for (const lz of [-0.42, 0.42]) put(G.unit, mat.wood, x + lx, base + 0.42, z + lz, 0.07, 0.84, 0.07);
            break;
          case '|': case 'd': {
            const set = ['|', 'd'], m = g === 'd' ? mat.rust : mat.iron;
            const alongX = isG(cx - 1, cz, set) || isG(cx + 1, cz, set);
            const alongZ = isG(cx, cz - 1, set) || isG(cx, cz + 1, set);
            for (const ax of [alongX ? 'x' : null, alongZ ? 'z' : null]) {
              if (!ax) continue;
              for (let k = 0; k < 5; k++) {
                const o = -C / 2 + (k + 0.5) * (C / 5);
                put(G.cyl, m, ax === 'x' ? x + o : x, base + 1.5, ax === 'x' ? z : z + o, 0.03, 3.0, 0.03);
              }
              for (const hy of [0.08, 1.5, 2.95]) put(G.unit, m, x, base + hy, z, ax === 'x' ? C : 0.08, 0.08, ax === 'x' ? 0.08 : C);
            }
            if (g === 'd') put(G.unit, mat.rail, x + (M.glyph(cx - 1, cz, level) === 'd' ? -0.65 : 0.65), base + 1.25, z + 0.07, 0.16, 0.24, 0.1);
            break;
          }
        }
      }
    }
  }

  // ---------- stairways ----------
  const STEPS = 14;
  for (const s of M.STAIRS) {
    const x = s.x * C + C / 2, zTop = s.z0 * C, len = (s.z1 - s.z0 + 1) * C;
    const drop = M.FLOOR_Y[0] - M.FLOOR_Y[1], run = len / STEPS, rise = drop / STEPS;
    for (let i = 0; i < STEPS; i++) {
      const top = M.FLOOR_Y[0] - (i + 0.5) * rise;
      const h = top - M.FLOOR_Y[1];
      put(G.unit, mat.step, x, M.FLOOR_Y[1] + h / 2, zTop + (i + 0.5) * run, C * 0.98, h, run + 0.01);
      put(G.unit, mat.stripe, x, top + 0.005, zTop + i * run + 0.06, C * 0.98, 0.012, 0.1);
    }
    // handrails on both side walls
    for (const side of [-1, 1]) {
      const ang = Math.atan2(drop, len), hl = Math.hypot(drop, len);
      put(G.unit, mat.rail, x + side * (C / 2 - 0.06), (M.FLOOR_Y[0] + M.FLOOR_Y[1]) / 2 + 0.95, zTop + len / 2, 0.05, 0.05, hl, ang, 0, 0);
    }
  }

  // ceiling of the ground floor + beams
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W * C, (H - 3) * C), mat.ceiling);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W * C / 2, M.CEIL[0], (3 + (H - 3) / 2) * C);
  root.add(ceil);
  for (let bz = 6; bz < H * C; bz += 6.4) put(G.unit, mat.wood, W * C / 2, M.CEIL[0] - 0.18, bz, W * C - 0.2, 0.3, 0.25);
  // basement pipes
  put(G.cyl, mat.pipe, W * C / 2, M.CEIL[1] - 0.35, 3 * C + 1.0, 0.1, W * C - 1, 0.1, 0, 0, Math.PI / 2);
  put(G.cyl, mat.pipe, W * C / 2, M.CEIL[1] - 0.6, 39 * C - 0.4, 0.13, W * C - 1, 0.13, 0, 0, Math.PI / 2);
  put(G.cyl, mat.pipe, C + 0.4, M.CEIL[1] - 0.45, H * C / 2, 0.1, H * C - 8, 0.1, Math.PI / 2, 0, 0);

  for (const b of batches.values()) {
    const im = new THREE.InstancedMesh(b.geom, b.material, b.list.length);
    b.list.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;
    root.add(im);
  }

  function makeSign(lines, bg, border, w, h) {
    const tex = textCanvasTex(lines, { bg, border });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  }

  // ---------- exit doors (one on each floor) ----------
  const exitMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a, emissive: 0x220000, emissiveIntensity: 1 });
  const exitFrame = new THREE.MeshBasicMaterial({ color: 0xaa2222 });
  for (const ex of M.EXITS) {
    const base = M.FLOOR_Y[ex.floor], fz = ex.face[1];
    const [[ax, az]] = ex.cells;
    const innerZ = fz > 0 ? (az + 1) * C : az * C;              // wall face the players stand in front of
    const midX = (ex.cells[0][0] + ex.cells[1][0] + 1) / 2 * C;
    for (const [cx] of ex.cells) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(C * 0.96, 3.4, 0.25), exitMat);
      door.position.set(cx * C + C / 2, base + 1.7, innerZ - fz * 0.15);
      root.add(door);
    }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2 * C + 0.3, 0.16, 0.34), exitFrame);
    frame.position.set(midX, base + 3.45, innerZ - fz * 0.1); root.add(frame);
    const sign = makeSign([{ text: 'EXIT', size: 70, color: '#ffffff' }, { text: ex.floor === 0 ? 'to the yard' : 'tunnel to the yard', size: 28, color: '#ffd0d0', weight: 700 }], '#7a0c0c', '#ff4b4b', 1.9, 0.6);
    sign.position.set(midX, base + 3.82, innerZ + fz * 0.03);
    sign.rotation.y = fz > 0 ? 0 : Math.PI;
    root.add(sign);
  }

  // ---------- signs over every room doorway ----------
  const SUB = { article: 'a · an · the', noun: 'naming words', adjective: 'describing words', verb: 'doing words' };
  const rotFor = (o) => (o[1] === 1 ? 0 : o[1] === -1 ? Math.PI : o[0] === 1 ? Math.PI / 2 : -Math.PI / 2);
  for (const key in M.ROOMS) {
    const R = M.ROOMS[key];
    for (const d of M.roomDoors(key)) {
      const sign = makeSign([{ text: R.name.toUpperCase(), size: 54, color: R.color }, { text: SUB[key], size: 32, color: '#ffffff', weight: 700 }], '#0d0d12', R.color, 2.9, 0.72);
      sign.position.set(d.cx * C + C / 2 + d.out[0] * (C / 2 + 0.03), M.FLOOR_Y[R.floor] + 3.3, d.cz * C + C / 2 + d.out[1] * (C / 2 + 0.03));
      sign.rotation.y = rotFor(d.out);
      root.add(sign);
    }
  }
  const ps = makeSign([{ text: 'PRISON', size: 70, color: '#ff6b6b' }], '#1a0606', '#ff4040', 2.2, 0.52);
  ps.position.set(18 * C, 3.25, 23 * C + 0.04); root.add(ps);
  // stair signs
  for (const s of M.STAIRS) {
    const down = makeSign([{ text: 'STAIRS DOWN', size: 46, color: '#ffd166' }, { text: 'to the Basement', size: 32, color: '#ffffff', weight: 700 }], '#101014', '#ffd166', 2.0, 0.55);
    down.position.set(s.x * C + C / 2, 3.45, s.z0 * C - 0.02); down.rotation.y = Math.PI; root.add(down);
    const up = makeSign([{ text: 'STAIRS UP', size: 46, color: '#ffd166' }, { text: 'to the Ground floor', size: 30, color: '#ffffff', weight: 700 }], '#101014', '#ffd166', 2.0, 0.55);
    up.position.set(s.x * C + C / 2, M.FLOOR_Y[1] + 3.3, (s.z1 + 1) * C + 0.02); root.add(up);
  }

  // ---------- word tables (glowing cards) ----------
  const tables = M.TABLES.map(t => {
    const gy = t.y;
    const block = new THREE.Mesh(G.unit, roomMat[t.room]);
    block.scale.set(0.36, 0.26, 0.26);
    block.position.set(t.x, gy + 1.02, t.z);
    root.add(block);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    sprite.position.set(t.x, gy + 1.75, t.z);
    sprite.scale.set(1.45, 0.55, 1);
    root.add(sprite);
    return { ...t, gy, block, sprite, word: '', baseY: gy + 1.75 };
  });
  const cardCache = new Map();
  function cardTexture(word, room) {
    const key = word + '|' + room;
    if (cardCache.has(key)) return cardCache.get(key);
    const col = M.ROOMS[room].color, label = TYPES[M.ROOMS[room].type].label.toLowerCase();
    const tex = canvasTex(320, 120, (g, w, h) => {
      g.fillStyle = 'rgba(10,10,16,0.9)';
      roundRect(g, 4, 4, w - 8, h - 8, 22); g.fill();
      g.strokeStyle = col; g.lineWidth = 7; roundRect(g, 4, 4, w - 8, h - 8, 22); g.stroke();
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '900 58px "Nunito", system-ui, sans-serif';
      g.fillText(word, w / 2, h * 0.45);
      g.fillStyle = col; g.font = '800 20px "Nunito", system-ui, sans-serif';
      g.fillText(label, w / 2, h * 0.82);
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    cardCache.set(key, tex);
    return tex;
  }
  function setTableWords(words) {
    tables.forEach((t, i) => {
      t.word = words[i] || '';
      t.sprite.material.map = cardTexture(t.word || '?', t.room);
      t.sprite.material.needsUpdate = true;
    });
  }
  let highlighted = -1;
  function highlightTable(id) { highlighted = id; }

  // ---------- lockers ----------
  const lockerMat = new THREE.MeshLambertMaterial({ color: 0x4c6a63 });
  const lockerDoorMat = new THREE.MeshLambertMaterial({ map: T.locker });
  const lockers = M.LOCKERS.map(L => {
    const grp = new THREE.Group();
    grp.position.set(L.x, L.y, L.z);
    grp.rotation.y = Math.atan2(L.face[0], L.face[1]);
    const body = new THREE.Mesh(G.unit, lockerMat);
    body.scale.set(1.15, 2.3, 0.85); body.position.y = 1.15; grp.add(body);
    const pivot = new THREE.Group(); pivot.position.set(-0.52, 1.15, 0.45); grp.add(pivot);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.04, 2.15, 0.05), lockerDoorMat);
    door.position.x = 0.52; pivot.add(door);
    root.add(grp);
    return { ...L, grp, pivot, anim: 0 };
  });
  function lockerFx(id) { const l = lockers[id]; if (l) l.anim = 1.0; }

  // ---------- lights (few and dim on purpose) ----------
  const ambient = new THREE.AmbientLight(0x6a78a8, 0.22);
  const hemi = new THREE.HemisphereLight(0x8090b0, 0x1a140e, 0.12);
  scene.add(ambient, hemi);
  const pointLights = M.LIGHTS.map((L, i) => {
    const y = M.CEIL[M.levelOfY(L.y)] - 0.5;
    const pl = new THREE.PointLight(L.color, L.power * 3, 9, 2);
    pl.position.set(L.x, y, L.z);
    scene.add(pl);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: L.color }));
    lamp.position.copy(pl.position); root.add(lamp);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0x222222, side: THREE.DoubleSide }));
    shade.position.set(L.x, y + 0.15, L.z); root.add(shade);
    return { pl, base: L.power * 3, flicker: L.flicker, color: new THREE.Color(L.color), seed: i * 1.7 };
  });
  const prisonLight = pointLights.find(p => p.color.r > 0.9 && p.color.g < 0.1) || pointLights[0];
  // each word room's lamp, so the room alarm can flash it
  const roomLight = {};
  for (const k in M.ROOMS) {
    const i = M.LIGHTS.findIndex(L => L.color.toLowerCase() === M.ROOMS[k].color.toLowerCase() && M.levelOfY(L.y) === M.ROOMS[k].floor);
    if (i >= 0) roomLight[k] = pointLights[i];
  }
  const alarms = new Set();
  function setAlarm(roomKey, on) { if (on) alarms.add(roomKey); else alarms.delete(roomKey); if (!on && roomLight[roomKey]) { roomLight[roomKey].pl.color.copy(roomLight[roomKey].color); roomLight[roomKey].pl.intensity = roomLight[roomKey].base; } }

  // ---------- vending machines ----------
  const shopTex = canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = '#0d1a2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd166'; g.fillRect(0, 0, w, 70);
    g.fillStyle = '#14161f'; g.font = '900 38px "Bungee", "Nunito", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('VENDING', w / 2, 38);
    const rows = [['WORD', '100', '#4da6ff'], ['TASER', '45', '#7fe9ff'], ['OIL', '45', '#c9a23a']];
    rows.forEach(([t, c, col], i) => {
      const y = 110 + i * 82;
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(18, y - 30, w - 36, 64);
      g.fillStyle = col; g.font = '900 34px "Nunito", sans-serif'; g.textAlign = 'left'; g.fillText(t, 32, y + 2);
      g.fillStyle = '#ffffff'; g.textAlign = 'right'; g.fillText(c, w - 32, y + 2);
    });
    g.fillStyle = '#ffd166'; g.font = '800 22px "Nunito", sans-serif'; g.textAlign = 'center'; g.fillText('points', w / 2, h - 24);
  });
  shopTex.wrapS = shopTex.wrapT = THREE.ClampToEdgeWrapping;
  const machineBody = new THREE.MeshLambertMaterial({ color: 0x24456b });
  const machineFront = new THREE.MeshBasicMaterial({ map: shopTex });
  for (const v of M.VENDING) {
    const grp = new THREE.Group();
    grp.position.set(v.x, v.y, v.z);
    grp.rotation.y = Math.atan2(v.face[0], v.face[1]);
    const body = new THREE.Mesh(G.unit, machineBody); body.scale.set(1.3, 2.3, 0.9); body.position.y = 1.15; grp.add(body);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.58), machineFront); front.position.set(0, 1.35, 0.456); grp.add(front);
    const slot = new THREE.Mesh(G.unit, mat.iron); slot.scale.set(0.8, 0.18, 0.1); slot.position.set(0, 0.35, 0.45); grp.add(slot);
    root.add(grp);
    const glow = new THREE.PointLight(0x7fd0ff, 6, 4.5, 2); glow.position.set(v.use.x, v.y + 1.6, v.use.z); scene.add(glow);
  }

  // ---------- oil slicks ----------
  const slickGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.02, 22);
  const slickMat = new THREE.MeshLambertMaterial({ color: 0x1a1408, emissive: 0x2a1e04, transparent: true, opacity: 0.92 });
  const slickMeshes = new Map();
  function setSlicks(list) {
    const keep = new Set(list.map(o => o.id));
    for (const [id, m] of slickMeshes) if (!keep.has(id)) { root.remove(m); slickMeshes.delete(id); }
    for (const o of list) if (!slickMeshes.has(o.id)) {
      const m = new THREE.Mesh(slickGeo, slickMat); m.position.set(o.x, o.y + 0.015, o.z); m.scale.set(1, 1, 0.8 + Math.random() * 0.3);
      root.add(m); slickMeshes.set(o.id, m);
    }
  }

  // ---------- taser bolts ----------
  const boltMat = new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const bolts = [];
  function zap(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z, len = Math.hypot(dx, dy, dz) || 0.1;
    const grp = new THREE.Group();
    grp.position.set((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
    grp.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ');
    for (let k = 0; k < 3; k++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 6), boltMat);
      seg.rotation.x = Math.PI / 2; seg.position.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, 0);
      grp.add(seg);
    }
    const flash = new THREE.PointLight(0x9ff3ff, 40, 7, 2); flash.position.set(to.x, to.y, to.z); scene.add(flash);
    root.add(grp); bolts.push({ grp, flash, t: 0.35 });
  }
  let prisonFlashT = 0;

  const moon = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false }));
  moon.position.set(40, 22, -45); root.add(moon);

  let exitUnlocked = false;
  function setExitUnlocked(b) {
    exitUnlocked = b;
    exitMat.emissive.set(b ? 0x0f7a2a : 0x220000);
    exitFrame.color.set(b ? 0x37ff6a : 0xaa2222);
  }
  function prisonFlash() { prisonFlashT = 1.6; }

  function setDarkness(level, brightness = 1) {
    // r155+ light units: ambient is divided by PI in the shader
    const amb = { dim: 0.8, dark: 0.22, pitch: 0.07 }[level] ?? 0.22;
    const fog = { dim: 0.055, dark: 0.075, pitch: 0.095 }[level] ?? 0.075;
    ambient.intensity = amb * brightness;
    hemi.intensity = 0.35 * amb * brightness;
    scene.fog.density = fog / Math.max(0.5, Math.sqrt(brightness));
  }

  function update(dt, t) {
    for (const L of pointLights) {
      if (L.flicker) {
        const f = 0.8 + 0.12 * Math.sin(t * 7 + L.seed) + 0.08 * Math.sin(t * 23 + L.seed * 3);
        L.pl.intensity = L.base * (Math.random() < 0.006 ? 0.1 : f);
      }
    }
    for (const k of alarms) { const L = roomLight[k]; if (!L) continue; const on = Math.sin(t * 14) > 0; L.pl.color.set(on ? 0xff1a1a : 0x330000); L.pl.intensity = L.base * (on ? 3 : 0.6); }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i]; b.t -= dt;
      b.grp.children.forEach(c => { c.position.x = (Math.random() - 0.5) * 0.14; c.position.y = (Math.random() - 0.5) * 0.14; });
      if (b.t <= 0) { root.remove(b.grp); scene.remove(b.flash); bolts.splice(i, 1); }
    }
    if (prisonFlashT > 0) {
      prisonFlashT -= dt;
      prisonLight.pl.color.set(prisonFlashT > 0 ? 0x40ff70 : prisonLight.color);
      prisonLight.pl.intensity = prisonLight.base * (prisonFlashT > 0 ? 3 : 1);
    }
    for (const l of lockers) {
      if (l.anim > 0) {
        l.anim = Math.max(0, l.anim - dt * 1.4);
        l.pivot.rotation.y = -Math.sin(Math.min(1, 1 - l.anim) * Math.PI) * 1.5;
      }
    }
    tables.forEach((tb, i) => {
      const s = i === highlighted ? 1.25 : 1;
      tb.sprite.scale.set(1.45 * s, 0.55 * s, 1);
      tb.sprite.position.y = tb.baseY + Math.sin(t * 2 + i) * 0.04;
      tb.block.rotation.y = t * 0.8 + i;
    });
    if (exitUnlocked) exitFrame.color.setHSL(0.38, 1, 0.45 + 0.15 * Math.sin(t * 6));
  }

  return { root, tables, lockers, setTableWords, highlightTable, lockerFx, setExitUnlocked, prisonFlash, setDarkness, update, setAlarm, setSlicks, zap };
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
