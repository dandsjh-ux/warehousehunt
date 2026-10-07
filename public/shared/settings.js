// Escape Warehouse – host options + character options (shared by server and client).

export const SETTINGS_SCHEMA = [
  { key: 'rounds', label: 'Rounds', options: [[3, '3'], [5, '5'], [7, '7'], [10, '10']] },
  { key: 'roundTime', label: 'Round time', options: [[120, '2 min'], [180, '3 min'], [240, '4 min'], [300, '5 min'], [420, '7 min']] },
  { key: 'startLevel', label: 'Starting level', options: [[1, 'Level 1 – The dog runs.'], [2, 'Level 2 – A happy cat sleeps.'], [3, 'Level 3 – The girl kicks a ball.'], [4, 'Level 4 – A brave boy finds the shiny key.'], [5, 'Level 5 – The big brown dog eats a red apple.']] },
  { key: 'ramp', label: 'Harder each round', options: [[true, 'Yes – sentences get longer'], [false, 'No – stay on one level']] },
  { key: 'hints', label: 'Word-type colour hints', options: [['always', 'Always'], ['early', 'Rounds 1–2 only'], ['never', 'Never']] },
  { key: 'headStart', label: 'Seeker counts for', options: [[10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds']] },
  { key: 'pingInterval', label: 'Locator ping', options: [[0, 'Off'], [15, 'Every 15 s'], [30, 'Every 30 s'], [45, 'Every 45 s'], [60, 'Every 60 s'], [90, 'Every 90 s']] },
  { key: 'pingDuration', label: 'Ping shows for', options: [[2, '2 seconds'], [3, '3 seconds'], [5, '5 seconds']] },
  { key: 'pingShowsSeeker', label: 'Ping also shows hiders the seeker', options: [[true, 'Yes'], [false, 'No']] },
  { key: 'nearWarn', label: '"Seeker is near" warning', options: [[0, 'Off'], [6, 'Within 6 m'], [10, 'Within 10 m'], [14, 'Within 14 m']] },
  { key: 'roomAlarm', label: 'Room alarm (seeker enters a word room)', options: [[true, 'On'], [false, 'Off']] },
  { key: 'shop', label: 'Vending machines', options: [[true, 'On'], [false, 'Off']] },
  { key: 'seekerSpeed', label: 'Seeker speed', options: [[0.9, 'Slower'], [1, 'Normal'], [1.1, 'Faster'], [1.2, 'Much faster']] },
  { key: 'seekers', label: 'Seekers', options: [[1, '1'], [2, '2 (needs 5+ players)']] },
  { key: 'rescue', label: 'Prison rescues', options: [[true, 'Allowed'], [false, 'Off']] },
  { key: 'lockers', label: 'Hiding lockers', options: [[true, 'On'], [false, 'Off']] },
  { key: 'lockerTime', label: 'Max time in a locker', options: [[10, '10 seconds'], [20, '20 seconds'], [30, '30 seconds']] },
  { key: 'hiderLights', label: 'Hider torches', options: [[true, 'Allowed'], [false, 'Off']] },
  { key: 'minimap', label: 'Minimap', options: [[true, 'On'], [false, 'Off']] },
  { key: 'darkness', label: 'Darkness', options: [['dim', 'Dim'], ['dark', 'Dark'], ['pitch', 'Very dark']] },
];

export const DEFAULT_SETTINGS = {
  rounds: 5, roundTime: 240, startLevel: 1, ramp: true, hints: 'early', headStart: 15,
  pingInterval: 30, pingDuration: 3, pingShowsSeeker: true, nearWarn: 10, roomAlarm: true, shop: true, seekerSpeed: 1, seekers: 1, rescue: true, lockers: true,
  lockerTime: 20, hiderLights: true, minimap: true, darkness: 'dark',
};

export function sanitizeSettings(s) {
  const out = {};
  for (const f of SETTINGS_SCHEMA) {
    const v = s ? s[f.key] : undefined;
    out[f.key] = f.options.some(o => o[0] === v) ? v : DEFAULT_SETTINGS[f.key];
  }
  return out;
}

export const LOOK_OPTIONS = {
  body: [['boy', 'Boy'], ['girl', 'Girl'], ['robot', 'Robot']],
  outfit: [['casual', 'T-shirt'], ['hoodie', 'Hoodie'], ['dress', 'Dress'], ['sporty', 'Sporty'], ['explorer', 'Explorer'], ['ninja', 'Ninja']],
  hairStyle: [['short', 'Short'], ['spiky', 'Spiky'], ['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun'], ['none', 'None']],
  hat: [['none', 'None'], ['cap', 'Cap'], ['beanie', 'Beanie'], ['bow', 'Bow'], ['crown', 'Crown'], ['headband', 'Headband']],
};
export const SKIN_TONES = ['#f9d7b9', '#eab68f', '#d39a6a', '#a96e45', '#7b4a2b', '#4f2f1c'];
export const HAIR_COLOURS = ['#1b1512', '#4a2c17', '#8a5a2b', '#d9b26a', '#c4492a', '#7a4fd1', '#2f80ed', '#e95fa6'];
export const CLOTH_COLOURS = ['#e63946', '#f4a261', '#ffd166', '#2a9d8f', '#3a86ff', '#8338ec', '#ff70a6', '#f1f1f1', '#3d3d46', '#6b4f2f'];

export const DEFAULT_LOOK = {
  body: 'boy', outfit: 'casual', hairStyle: 'short', hat: 'none',
  skin: SKIN_TONES[1], hair: HAIR_COLOURS[1], shirt: CLOTH_COLOURS[4], pants: CLOTH_COLOURS[8],
};

const HEX = /^#[0-9a-f]{6}$/i;
export function sanitizeLook(l) {
  const out = { ...DEFAULT_LOOK };
  if (!l || typeof l !== 'object') return out;
  for (const k of Object.keys(LOOK_OPTIONS)) {
    if (LOOK_OPTIONS[k].some(o => o[0] === l[k])) out[k] = l[k];
  }
  for (const k of ['skin', 'hair', 'shirt', 'pants']) {
    if (typeof l[k] === 'string' && HEX.test(l[k])) out[k] = l[k].toLowerCase();
  }
  return out;
}

// Vending machine economy (points reset every round)
export const SHOP = {
  perSecond: 1,        // free hiders earn 1 point every second
  perWord: 10,         // and 10 points for every word they collect
  prices: { word: 100, taser: 45, oil: 45 },
  stunSeconds: 3,      // taser hit or oil slip
  taserRange: 12,      // metres
  taserWidth: 0.9,     // how close the shot must pass to the seeker (aim help for young players)
  oilLife: 90,         // seconds an oil slick stays on the floor
};
