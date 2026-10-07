// Escape Warehouse – shared map (used by BOTH the server and the browser).
// Two floors (Ground floor + Basement) joined by three stairways.
// Each character is one 1.6 m square cell. Keep every row exactly 36 characters wide.
//
//  #  brick wall          .  floor              o  yard (outside, after escaping)
//  f  yard fence          S  shelf rack (full height, blocks sight)
//  c  low crate (crouch behind it, climb over it)  C  tall crate stack (blocks sight)
//  b  sandbags (low, climb over them)            L  hiding locker      w  word table
//  |  prison bars         d  prison door        P  prison floor
//  E  exit door (one on each floor) v  stairway (same cells on BOTH floors, goes down southwards)
//  M  vending machine (one per floor, beside the prison)
//  (space) nothing

export const CELL = 1.6;
export const FLOOR_Y = [0, -4.4];          // ground floor, basement
export const CEIL = [4.2, -0.25];          // ceiling height of each floor
export const FLOOR_NAMES = ['Ground floor', 'Basement'];

export const GROUND = [
  '             ffffffffff             ', // 0
  '             foooooooof             ', // 1
  '             foooooooof             ', // 2
  '#################EE#################', // 3
  '#w..w..w.#.S.S.SS..SS.S..#w.w.w.w.w#', // 4
  '#........#.S.S.SS..SS.S..#.........#', // 5
  '#..SS..L.#...S.SS..SS.S..#.SS...SS.#', // 6
  '#............S.SS..SS.S............#', // 7
  '#..SS....#......c........#w.w...w.w#', // 8
  '#........#.SSSS..SSS.SSS.#.........#', // 9
  '#w..w..w.#....c.........L#.SS.L.SS.#', // 10
  '####.#####.SSSS.SSSS.SSS.#.........#', // 11
  '#...............b........#w..w.w..w#', // 12
  '#..........SS.SSSSSS.SSS.#####.#####', // 13
  '#................SS................#', // 14
  '#.S.SSSSS.SS............SS.SS....S.#', // 15
  '#.#v#.SS.S.......M........C........#', // 16
  '#.#v#.SS.SS.SS||||||||.SS.SSS..#v#.#', // 17
  '#.#v#.L.......|PPPPPP|.........#v#.#', // 18
  '#.#v#.SS.SS.SS|PPPPPP|.SS.SSS..#v#.#', // 19
  '#.#v#.........|PPPPPP|....L....#v#.#', // 20
  '#..#.SS.SS.SSS|PPPPPP|.SS.SSS..#v#.#', // 21
  '#.............|||dd|||..........#..#', // 22
  '#.SSSSS.SSSS..c......c..SSSS.SSSS..#', // 23
  '#..b.............SS.........C......#', // 24
  '#.SS.SS.SS.SS.SS.SS.SS.SS.SS.SS.SS.#', // 25
  '#.SS.SL.SS.SS.SS.SS.SS.SS.SL.SS.SS.#', // 26
  '#.SS....SS....SS.SS....SS.SS....SS.#', // 27
  '#.SS.SS.S..SS.SS.SS.SS.Sb.SS.SS.SS.#', // 28
  '#.SS.SS.SS.SS.SS.SS.SS.SS.SS.SS.SS.#', // 29
  '#.....C.........L..................#', // 30
  '#.SS.SS.SS.SS.SS#v#.SS.SS.SS.SS.SS.#', // 31
  '#.SS.SS.LS.SS.SS#v#.SS.SS.LS.SS.SS.#', // 32
  '#.SS....SS..S.SS#v#.SS....SS....SS.#', // 33
  '#.SS.SS.SS.SS.SS#v#.SS.SS.SS.SS.SS.#', // 34
  '#.SS.SS.SS.SS.SS#v#.SS.SS.SS.SS.SS.#', // 35
  '#......b.........#......C..........#', // 36
  '#...........b.........C............#', // 37
  '#..c....L.....c........c......L....#', // 38
  '####################################', // 39
];

export const BASEMENT = [
  '                                    ', // 0
  '                                    ', // 1
  '                                    ', // 2
  '####################################', // 3
  '#w.w.w.w.w.#.SSS.SSSS.SSSSS.SSS.S..#', // 4
  '#..........#..............b........#', // 5
  '#.SS..SS..L#.SS.SS.SS.SS.SS.SS.SS..#', // 6
  '#..........#..S.SS.SS.SS.SS.SS.SS..#', // 7
  '#w.w...w......S.SS....SS.SS....SS..#', // 8
  '#..........#....C..................#', // 9
  '#.SS..SS...#.SS.SS.SS.SS.SS.SS.SS..#', // 10
  '#..........#.SS.SS.SS.LS.SS.SS.SS..#', // 11
  '#w.w.w..w.w#.SS.SS.SS.SS.SS.SS.SS..#', // 12
  '######.#####......b.......C........#', // 13
  '#...............L..................#', // 14
  '#..#....S.SSSS.SSSS.SSSS.SSSS.S....#', // 15
  '#.#v#..SS.SSSSSS....SSSSS.......#..#', // 16
  '#.#v#..SSSS.SSSSS..SSSSS.SSSS..#v#.#', // 17
  '#.#v#L.SSSS.SSSSS..SSSSS.SSSS.L#v#.#', // 18
  '#.#v#..SSSS.SSSSSM.SSSSS.SSSS..#v#.#', // 19
  '#.#v#.........b........C.......#v#.#', // 20
  '#.#.#..SSSS.SSSSS..SSSSS.SSSS..#v#.#', // 21
  '#..............L..........b...C....#', // 22
  '#.SSS.SSSS.SSSSS..SSSSS.SSSS.SSSS..#', // 23
  '#..................L...............#', // 24
  '#.SSS.SSSS.SSS.SSSS.SSS.SSSS...S...#', // 25
  '#.......b.......C......######.######', // 26
  '#.SS.SS.SS.SS.SS.SS.SS.#w.w.w.w.w.w#', // 27
  '#.SS.SS.SS.SS.SS.SS.SS.#...........#', // 28
  '#.SS.SS.SS.SS.SS.SS.SS.#.SS.SSS.SS.#', // 29
  '#................#.....#...........#', // 30
  '#.SS.SS.SS.SS.S.#v#.S..#w.w.w.w.w.w#', // 31
  '#.SS.SS.SS.SS.S.#v#.S......L.......#', // 32
  '#.SS.SS.SS.SS.S.#v#.S..#.SS.SSS.SS.#', // 33
  '#...............#v#....#...........#', // 34
  '#.SS.SS.SS.SS.S.#v#.SS.#w...w...w..#', // 35
  '#......................#...........#', // 36
  '#..b.....L..........C..#....L...b..#', // 37
  '#......................#...........#', // 38
  '######EE############################', // 39
];

export const FLOORS = [GROUND, BASEMENT];
export const W = GROUND[0].length;
export const H = GROUND.length;

// Stairways: x column, z0 = top cell (ground floor end), z1 = bottom cell (basement end)
export const STAIRS = [
  { name: 'west stairs', x: 3, z0: 16, z1: 20 },
  { name: 'east stairs', x: 32, z0: 17, z1: 21 },
  { name: 'south stairs', x: 17, z0: 31, z1: 35 },
];

const BLOCKING = new Set(['#', 'f', ' ', 'S', 'c', 'C', 'b', 'L', 'w', '|', 'd', 'E', 'i', 'M']);
// Tall things block the camera and sight (low crates, tables, sandbags do not).
export const TALL = new Set(['#', 'f', ' ', 'S', 'C', 'L', '|', 'd', 'E', 'M']);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function levelOfY(y) { return y < (FLOOR_Y[0] + FLOOR_Y[1]) / 2 ? 1 : 0; }
export function glyph(cx, cz, level = 0) {
  const rows = FLOORS[level] || GROUND;
  if (cz < 0 || cz >= H || cx < 0 || cx >= W) return ' ';
  return rows[cz][cx];
}
export function blockedCell(cx, cz, level = 0) { return BLOCKING.has(glyph(cx, cz, level)); }
export function cellOf(x, z) { return [Math.floor(x / CELL), Math.floor(z / CELL)]; }
export function cellCenter(cx, cz) { return [(cx + 0.5) * CELL, (cz + 0.5) * CELL]; }

export function stairAt(cx, cz) {
  return STAIRS.find(s => s.x === cx && cz >= s.z0 && cz <= s.z1) || null;
}
export function stairHeight(s, z) {
  const t = clamp((z - s.z0 * CELL) / ((s.z1 - s.z0 + 1) * CELL), 0, 1);
  return FLOOR_Y[0] + (FLOOR_Y[1] - FLOOR_Y[0]) * t;
}
// Floor height under (x, z) for someone currently at height y
export function groundHeight(x, z, y = 0) {
  const lv = levelOfY(y);
  const [cx, cz] = cellOf(x, z);
  if (glyph(cx, cz, lv) === 'v') { const s = stairAt(cx, cz); if (s) return stairHeight(s, z); }
  return FLOOR_Y[lv];
}

// Rooms: rect = [x0, z0, x1, z1] in cells (inclusive)
export const ROOMS = {
  article:   { name: 'Article Room',      type: 'A', color: '#ffcc33', floor: 0, rect: [1, 4, 8, 10] },
  noun:      { name: 'Noun Hall',         type: 'N', color: '#4da6ff', floor: 0, rect: [26, 4, 34, 12] },
  adjective: { name: 'Adjective Gallery', type: 'J', color: '#5ad85a', floor: 1, rect: [1, 4, 10, 12] },
  verb:      { name: 'Verb Basement',     type: 'V', color: '#ff5a5a', floor: 1, rect: [24, 27, 34, 38] },
};
export const PRISON_RECT = [15, 18, 20, 21];

export function roomAtCell(cx, cz, level = 0) {
  for (const k in ROOMS) {
    const R = ROOMS[k], [x0, z0, x1, z1] = R.rect;
    if (R.floor === level && cx >= x0 && cx <= x1 && cz >= z0 && cz <= z1) return k;
  }
  return null;
}
export function roomAt(x, z, y = 0) { const [cx, cz] = cellOf(x, z); return roomAtCell(cx, cz, levelOfY(y)); }
export function inPrison(x, z, y = 0) {
  if (levelOfY(y) !== 0) return false;
  const [cx, cz] = cellOf(x, z), [x0, z0, x1, z1] = PRISON_RECT;
  return cx >= x0 && cx <= x1 && cz >= z0 && cz <= z1;
}

// Doorways of each room (cells in the wall ring that are open) – used for signs
export function roomDoors(key) {
  const R = ROOMS[key], [x0, z0, x1, z1] = R.rect, out = [];
  for (let x = x0; x <= x1; x++) {
    if (!blockedCell(x, z0 - 1, R.floor)) out.push({ cx: x, cz: z0 - 1, out: [0, -1] });
    if (!blockedCell(x, z1 + 1, R.floor)) out.push({ cx: x, cz: z1 + 1, out: [0, 1] });
  }
  for (let z = z0; z <= z1; z++) {
    if (!blockedCell(x0 - 1, z, R.floor)) out.push({ cx: x0 - 1, cz: z, out: [-1, 0] });
    if (!blockedCell(x1 + 1, z, R.floor)) out.push({ cx: x1 + 1, cz: z, out: [1, 0] });
  }
  return out;
}

// Circle (radius r) vs blocked cells on one floor. Returns the corrected position.
export function collide(x, z, r = 0.32, level = 0) {
  for (let iter = 0; iter < 3; iter++) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx, gz = cz + dz;
      if (!blockedCell(gx, gz, level)) continue;
      const minX = gx * CELL, maxX = minX + CELL, minZ = gz * CELL, maxZ = minZ + CELL;
      const px = clamp(x, minX, maxX), pz = clamp(z, minZ, maxZ);
      const ddx = x - px, ddz = z - pz, d2 = ddx * ddx + ddz * ddz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2), push = (r - d) / d;
        x += ddx * push; z += ddz * push;
      } else {
        const l = x - minX, rr = maxX - x, t = z - minZ, b = maxZ - z, m = Math.min(l, rr, t, b);
        if (m === l) x = minX - r; else if (m === rr) x = maxX + r; else if (m === t) z = minZ - r; else z = maxZ + r;
      }
    }
  }
  return { x, z };
}

// Low obstacles you can climb over with the action key
export const CLIMBABLE = new Set(['c', 'b']);
// If (x, z) is right up against a low crate in the direction `ry`, return where you land on the far side.
export function climbTarget(x, z, ry, level) {
  const fx = Math.sin(ry), fz = Math.cos(ry);
  let dx = 0, dz = 0;
  if (Math.abs(fx) > Math.abs(fz)) dx = Math.sign(fx); else dz = Math.sign(fz);
  const [cx, cz] = cellOf(x, z);
  const ox = cx + dx, oz = cz + dz;
  if (!CLIMBABLE.has(glyph(ox, oz, level))) return null;
  const gap = dx ? (dx > 0 ? (cx + 1) * CELL - x : x - cx * CELL) : (dz > 0 ? (cz + 1) * CELL - z : z - cz * CELL);
  if (gap > 0.8) return null;                       // not close enough
  const tx = ox + dx, tz = oz + dz;
  const g = glyph(tx, tz, level);
  if (blockedCell(tx, tz, level) || g === 'v' || g === 'P') return null;  // nowhere safe to land
  const [lx, lz] = cellCenter(tx, tz);
  return { x: dx ? lx : x, z: dz ? lz : z, ox, oz };
}

function listCells(ch) {
  const out = [];
  FLOORS.forEach((rows, level) => {
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      if (rows[z][x] === ch) {
        const [wx, wz] = cellCenter(x, z);
        out.push({ cx: x, cz: z, x: wx, z: wz, floor: level, y: FLOOR_Y[level] });
      }
    }
  });
  return out;
}
function openSide(c) {
  for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (!blockedCell(c.cx + dx, c.cz + dz, c.floor)) return [dx, dz];
  }
  return [0, 1];
}

export const TABLES = listCells('w').map((c, i) => ({ id: i, ...c, room: roomAtCell(c.cx, c.cz, c.floor) }));
export const LOCKERS = listCells('L').map((c, i) => ({ id: i, ...c, face: openSide(c) }));
export const VENDING = listCells('M').map((c, i) => {
  const face = openSide(c);
  return { id: i, ...c, face, use: { x: c.x + face[0] * CELL, z: c.z + face[1] * CELL, y: c.y } };
});

// Which word room a doorway cell belongs to ("cx,cz,floor" -> room key)
const DOOR_ROOM = new Map();
// Is (x, y, z) inside a word room or standing in one of its doorways? Returns the room key or null.
export function roomOrDoorAt(x, z, y = 0) {
  if (!DOOR_ROOM.size) for (const k in ROOMS) for (const dr of roomDoors(k)) DOOR_ROOM.set(`${dr.cx},${dr.cz},${ROOMS[k].floor}`, k);
  const lv = levelOfY(y), [cx, cz] = cellOf(x, z);
  return roomAtCell(cx, cz, lv) || DOOR_ROOM.get(`${cx},${cz},${lv}`) || null;
}

// Clear line of sight along a floor (tall things block it, low crates do not)
export function lineClear(x0, z0, x1, z1, level) {
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 0.2);
  for (let i = 1; i < n; i++) {
    const t = i / n, [cx, cz] = cellOf(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
    if (TALL.has(glyph(cx, cz, level))) return false;
  }
  return true;
}

const pt = (cx, cz, level = 0) => { const [x, z] = cellCenter(cx, cz); return { x, z, y: FLOOR_Y[level] }; };
// Key points (world metres)
// Exits: one on each floor so the seeker can't guard them both.
// cells = the two door cells in the outer wall, face = direction from the door into the warehouse.
export const EXITS = [
  { name: 'ground floor exit', floor: 0, cells: [[17, 3], [18, 3]], face: [0, 1], point: { x: 18 * CELL, z: 4 * CELL + 0.7, y: FLOOR_Y[0] } },
  { name: 'basement exit', floor: 1, cells: [[6, 39], [7, 39]], face: [0, -1], point: { x: 7 * CELL, z: 39 * CELL - 0.7, y: FLOOR_Y[1] } },
];
export const EXIT_POINT = EXITS[0].point;
export const RESCUE_POINT = { x: 18 * CELL, z: 23 * CELL + 0.6, y: 0 };
export const HIDER_SPAWNS = [[17, 5], [18, 5], [17, 6], [18, 6], [17, 7], [18, 7], [14, 8], [15, 8], [19, 8], [20, 8], [12, 8], [21, 8]].map(([a, b]) => pt(a, b));
export const SEEKER_SPAWNS = [[31, 36], [33, 36], [32, 38], [34, 38]].map(([a, b]) => pt(a, b));
export const PRISON_SPOTS = [[15, 18], [17, 18], [19, 18], [16, 19], [18, 19], [20, 19], [15, 20], [17, 20], [19, 20], [16, 21], [18, 21], [20, 21]].map(([a, b]) => pt(a, b));
export const RELEASE_SPOTS = [[15, 23], [16, 23], [19, 23], [20, 23], [16, 24]].map(([a, b]) => pt(a, b));
export const YARD_SPOTS = [[14, 1], [16, 2], [18, 1], [20, 2], [15, 2], [21, 1]].map(([a, b]) => pt(a, b));
export const YARD_RECT = { x0: 14 * CELL + 0.35, x1: 22 * CELL - 0.35, z0: 1 * CELL + 0.35, z1: 3 * CELL - 0.35 };

// A few dim lamps – the warehouse is meant to be DARK. Torches do the rest.
export const LIGHTS = [
  { ...pt(4, 7, 0), color: '#ffcc33', power: 7, flicker: false },     // article room
  { ...pt(30, 8, 0), color: '#4da6ff', power: 8, flicker: false },    // noun hall
  { ...pt(17.5, 19.5, 0), color: '#ff3030', power: 6, flicker: false }, // prison
  { ...pt(9, 30, 0), color: '#ffb066', power: 5, flicker: true },     // ground SW aisles
  { ...pt(28, 24, 0), color: '#ffb066', power: 5, flicker: true },    // ground E aisles
  { ...pt(5, 8, 1), color: '#5ad85a', power: 7, flicker: false },     // adjective gallery
  { ...pt(29, 32, 1), color: '#ff5a5a', power: 7, flicker: true },    // verb basement
  { ...pt(17, 18, 1), color: '#ffb066', power: 4, flicker: true },    // basement middle
];
