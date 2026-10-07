// Escape Warehouse – Year 3/4 word bank and sentence builder (shared by server and browser).
// 24 sentence patterns across 5 levels, singular AND plural, so rounds rarely repeat.
// Rule: every word belongs to exactly ONE word class (one room).

export const TYPES = {
  A: { key: 'article',   label: 'Article',   room: 'article',   color: '#ffcc33' },
  N: { key: 'noun',      label: 'Noun',      room: 'noun',      color: '#4da6ff' },
  V: { key: 'verb',      label: 'Verb',      room: 'verb',      color: '#ff5a5a' },
  J: { key: 'adjective', label: 'Adjective', room: 'adjective', color: '#5ad85a' },
};

export const ARTICLES = ['a', 'an', 'the'];

// ---------- nouns (singular → plural) ----------
export const ANIMATES = ['dog', 'cat', 'bird', 'horse', 'rabbit', 'girl', 'boy', 'teacher', 'farmer', 'baby', 'king', 'queen',
  'robot', 'monkey', 'lion', 'owl', 'elephant', 'ant', 'pirate', 'frog', 'duck', 'fish', 'dragon', 'penguin', 'tiger', 'zebra',
  'doctor', 'chef', 'clown', 'snail'];
export const FOOD = ['apple', 'cake', 'egg', 'orange', 'sandwich', 'banana', 'cookie', 'pizza', 'carrot', 'pie', 'grape'];
export const THINGS = ['ball', 'book', 'kite', 'hat', 'box', 'umbrella', 'drum', 'key', 'letter', 'car', 'shoe', 'pencil',
  'balloon', 'cup', 'sock', 'bag', 'bike', 'bell', 'rocket', 'teddy'];
// 'fish' and 'drum' stay singular only ('fish' is the same in the plural, 'drums' can also be a verb)
export const PLURAL = {
  dog: 'dogs', cat: 'cats', bird: 'birds', horse: 'horses', rabbit: 'rabbits', girl: 'girls', boy: 'boys', teacher: 'teachers',
  farmer: 'farmers', baby: 'babies', king: 'kings', queen: 'queens', robot: 'robots', monkey: 'monkeys', lion: 'lions', owl: 'owls',
  elephant: 'elephants', ant: 'ants', pirate: 'pirates', frog: 'frogs', duck: 'ducks', dragon: 'dragons', penguin: 'penguins',
  tiger: 'tigers', zebra: 'zebras', doctor: 'doctors', chef: 'chefs', clown: 'clowns', snail: 'snails',
  apple: 'apples', cake: 'cakes', egg: 'eggs', orange: 'oranges', sandwich: 'sandwiches', banana: 'bananas', cookie: 'cookies',
  pizza: 'pizzas', carrot: 'carrots', pie: 'pies', grape: 'grapes',
  ball: 'balls', book: 'books', kite: 'kites', hat: 'hats', box: 'boxes', umbrella: 'umbrellas', key: 'keys', letter: 'letters',
  car: 'cars', shoe: 'shoes', pencil: 'pencils', balloon: 'balloons', cup: 'cups', sock: 'socks', bag: 'bags', bike: 'bikes',
  bell: 'bells', rocket: 'rockets', teddy: 'teddies',
};

// ---------- verbs (he/she/it form → plural "they" form) ----------
export const INTRANS = ['runs', 'jumps', 'sleeps', 'sings', 'swims', 'laughs', 'cries', 'dances', 'hops', 'shouts', 'smiles',
  'waves', 'sits', 'hides', 'claps', 'yawns', 'skips', 'wins', 'sneezes', 'giggles', 'wobbles'];
export const TRANS = ['eats', 'kicks', 'finds', 'holds', 'pushes', 'carries', 'throws', 'wants', 'sees', 'draws', 'likes',
  'catches', 'drops', 'hugs', 'opens', 'paints', 'grabs', 'shares', 'builds', 'fixes', 'licks', 'washes', 'loses'];
export const BASE = {
  runs: 'run', jumps: 'jump', sleeps: 'sleep', sings: 'sing', swims: 'swim', laughs: 'laugh', cries: 'cry', dances: 'dance',
  hops: 'hop', shouts: 'shout', smiles: 'smile', waves: 'wave', sits: 'sit', hides: 'hide', claps: 'clap', yawns: 'yawn',
  skips: 'skip', wins: 'win', sneezes: 'sneeze', giggles: 'giggle', wobbles: 'wobble',
  eats: 'eat', kicks: 'kick', finds: 'find', holds: 'hold', pushes: 'push', carries: 'carry', throws: 'throw', wants: 'want',
  sees: 'see', draws: 'draw', likes: 'like', catches: 'catch', drops: 'drop', hugs: 'hug', opens: 'open', paints: 'paint',
  grabs: 'grab', shares: 'share', builds: 'build', fixes: 'fix', licks: 'lick', washes: 'wash', loses: 'lose',
};

// What each verb can sensibly do things to (anything not listed can take any food or thing)
const VERB_OBJECTS = {
  eats: FOOD, licks: ['cake', 'cookie', 'pizza', 'banana', 'orange', 'apple', 'pie', 'grape'],
  kicks: ['ball', 'box', 'shoe', 'sock', 'balloon', 'bag'],
  throws: ['ball', 'hat', 'sock', 'shoe', 'balloon', 'pencil', 'key', 'teddy', 'egg', 'cookie'],
  pushes: ['car', 'bike', 'box', 'ball', 'rocket'],
  catches: ['ball', 'balloon', 'hat', 'kite', 'egg', 'cookie', 'key'],
  opens: ['box', 'book', 'umbrella', 'letter', 'bag'],
  paints: ['kite', 'box', 'car', 'bike', 'hat', 'rocket', 'cup', 'egg'],
  draws: ['car', 'kite', 'hat', 'rocket', 'bike', 'cake', 'apple', 'balloon'],
  builds: ['rocket', 'car', 'box', 'kite'],
  fixes: ['car', 'bike', 'rocket', 'umbrella', 'kite', 'bell', 'teddy'],
  washes: ['car', 'bike', 'cup', 'sock', 'shoe', 'hat', 'bag', 'teddy', 'apple', 'carrot', 'grape'],
  loses: ['key', 'hat', 'sock', 'shoe', 'pencil', 'ball', 'bag', 'teddy', 'letter'],
  hugs: ['teddy', 'book', 'ball', 'balloon', 'bag'],
};

// ---------- adjectives ----------
// Two adjectives always follow the natural English order: opinion → size → age → colour.
export const ADJ_QUALITY = ['happy', 'sad', 'hungry', 'brave', 'funny', 'sleepy', 'angry', 'clever', 'lazy', 'noisy', 'kind',
  'silly', 'grumpy', 'shy', 'proud', 'tired', 'cheeky', 'gentle'];                 // people & animals
export const ADJ_SIZE = ['big', 'small', 'tiny', 'little', 'huge'];
export const ADJ_AGE = ['old', 'young', 'new'];
export const ADJ_COLOUR = ['red', 'blue', 'green', 'yellow', 'brown', 'pink', 'purple', 'black', 'white'];
export const ADJ_THING = ['shiny', 'magic', 'smelly', 'heavy', 'soft', 'dirty', 'broken'];   // things
export const ADJ_FOOD = ['yummy', 'juicy', 'crunchy', 'sweet'];                              // food
const TALL = ['tall'];

const uniq = (a) => [...new Set(a)];
export const ROOM_POOLS = {
  article: ARTICLES,
  noun: uniq([...ANIMATES, ...FOOD, ...THINGS, ...Object.values(PLURAL)]),
  verb: uniq([...INTRANS, ...TRANS, ...Object.values(BASE)]),
  adjective: uniq([...ADJ_QUALITY, ...ADJ_SIZE, ...TALL, ...ADJ_AGE, ...ADJ_COLOUR, ...ADJ_THING, ...ADJ_FOOD]),
};
export const WORD_TYPE = {};
for (const w of ROOM_POOLS.article) WORD_TYPE[w] = 'A';
for (const w of ROOM_POOLS.noun) WORD_TYPE[w] = 'N';
for (const w of ROOM_POOLS.verb) WORD_TYPE[w] = 'V';
for (const w of ROOM_POOLS.adjective) WORD_TYPE[w] = 'J';

// "Twin" = the other number of the same word (dog/dogs, runs/run). Used as tricky distractors.
const TWIN = {};
for (const [s, p] of Object.entries(PLURAL)) { TWIN[s] = p; TWIN[p] = s; }
for (const [s, b] of Object.entries(BASE)) { TWIN[s] = b; TWIN[b] = s; }
export function twinOf(word) { return TWIN[word] || null; }

// ---------- sentence patterns ----------
// s / o = noun phrase: [number 'sg'|'pl', article?, number of adjectives]; v = 'i' (no object) or 't' (has an object)
export const PATTERNS = [
  // Level 1
  { id: 1,  level: 1, s: ['sg', 1, 0], v: 'i', ex: 'The dog runs.' },
  { id: 2,  level: 1, s: ['pl', 1, 0], v: 'i', ex: 'The dogs run.' },
  { id: 3,  level: 1, s: ['pl', 0, 0], v: 'i', ex: 'Frogs jump.' },
  // Level 2
  { id: 4,  level: 2, s: ['sg', 1, 1], v: 'i', ex: 'A happy cat sleeps.' },
  { id: 5,  level: 2, s: ['pl', 1, 1], v: 'i', ex: 'The happy cats sleep.' },
  { id: 6,  level: 2, s: ['pl', 0, 1], v: 'i', ex: 'Hungry frogs jump.' },
  { id: 7,  level: 2, s: ['sg', 1, 0], v: 't', o: ['pl', 0, 0], ex: 'The baby wants cookies.' },
  { id: 8,  level: 2, s: ['pl', 0, 0], v: 't', o: ['pl', 0, 0], ex: 'Monkeys like bananas.' },
  // Level 3
  { id: 9,  level: 3, s: ['sg', 1, 0], v: 't', o: ['sg', 1, 0], ex: 'The girl kicks a ball.' },
  { id: 10, level: 3, s: ['pl', 1, 0], v: 't', o: ['sg', 1, 0], ex: 'The boys kick a ball.' },
  { id: 11, level: 3, s: ['sg', 1, 0], v: 't', o: ['pl', 0, 1], ex: 'The king eats red apples.' },
  { id: 12, level: 3, s: ['sg', 1, 2], v: 'i', ex: 'The sleepy little cat yawns.' },
  { id: 13, level: 3, s: ['pl', 0, 1], v: 't', o: ['sg', 1, 0], ex: 'Clever robots fix the car.' },
  // Level 4
  { id: 14, level: 4, s: ['sg', 1, 1], v: 't', o: ['sg', 1, 0], ex: 'The brave pirate finds a key.' },
  { id: 15, level: 4, s: ['sg', 1, 0], v: 't', o: ['sg', 1, 1], ex: 'A girl paints the green kite.' },
  { id: 16, level: 4, s: ['sg', 1, 1], v: 't', o: ['sg', 1, 1], ex: 'A brave boy finds the shiny key.' },
  { id: 17, level: 4, s: ['pl', 1, 1], v: 't', o: ['sg', 1, 1], ex: 'The sleepy owls want the yummy cake.' },
  { id: 18, level: 4, s: ['sg', 1, 1], v: 't', o: ['pl', 0, 1], ex: 'The hungry lion eats juicy apples.' },
  { id: 19, level: 4, s: ['pl', 1, 2], v: 'i', ex: 'The tiny green frogs hop.' },
  // Level 5
  { id: 20, level: 5, s: ['sg', 1, 2], v: 't', o: ['sg', 1, 1], ex: 'The big brown dog eats a red apple.' },
  { id: 21, level: 5, s: ['sg', 1, 1], v: 't', o: ['sg', 1, 2], ex: 'A clever girl finds the tiny blue key.' },
  { id: 22, level: 5, s: ['pl', 1, 2], v: 't', o: ['sg', 1, 1], ex: 'The small green frogs want the shiny ball.' },
  { id: 23, level: 5, s: ['sg', 1, 2], v: 't', o: ['pl', 0, 2], ex: 'The grumpy old king eats big juicy apples.' },
  { id: 24, level: 5, s: ['pl', 1, 1], v: 't', o: ['sg', 1, 2], ex: 'The cheeky monkeys grab the big yellow banana.' },
];

export const LEVELS = {};
for (let l = 1; l <= 5; l++) {
  const ps = PATTERNS.filter(p => p.level === l);
  LEVELS[l] = { example: ps[0].ex, patterns: ps.length, examples: ps.map(p => p.ex) };
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

// "a" or "an" depends on the sound of the NEXT word
export function articleFor(next, rng = Math.random) {
  if (rng() < 0.5) return 'the';
  return /^[aeiou]/.test(next) ? 'an' : 'a';
}

// People never get colour words (no "white boys" or "pink pirate"); animals, robots and things can.
const PEOPLE = new Set(['girl', 'boy', 'teacher', 'farmer', 'baby', 'king', 'queen', 'pirate', 'doctor', 'chef', 'clown']);
function kindOf(noun) { return PEOPLE.has(noun) ? 'person' : ANIMATES.includes(noun) ? 'animal' : FOOD.includes(noun) ? 'food' : 'thing'; }

// one or two adjectives that suit the noun, in natural order
function adjectivesFor(kind, n, rng, avoid) {
  if (n === 0) return [];
  const ok = (list) => list.filter(a => !avoid.includes(a));
  const cats = kind === 'person'
    ? { Q: ADJ_QUALITY, S: [...ADJ_SIZE, ...TALL], A: ['old'], Y: ['young'] }
    : kind === 'animal'
      ? { Q: ADJ_QUALITY, S: [...ADJ_SIZE, ...TALL], A: ['old'], Y: ['young'], C: ADJ_COLOUR }
      : kind === 'food'
        ? { O: ['yummy'], S: ['big', 'small', 'tiny', 'huge'], T: ['juicy', 'crunchy', 'sweet'], C: ADJ_COLOUR }
        : { Q: ADJ_THING, S: ADJ_SIZE, A: ['old', 'new'], C: ADJ_COLOUR };
  if (n === 1) {
    // people & animals mostly get a feeling word; things/food get any suitable word
    if ((kind === 'person' || kind === 'animal') && rng() < 0.65) return [pick(ok(cats.Q), rng)];
    return [pick(ok(Object.values(cats).flat()), rng)];
  }
  // natural order: opinion → size → age → texture → colour
  const PAIRS = kind === 'person' ? [['Q', 'S'], ['Q', 'A'], ['S', 'A'], ['Q', 'Y']]
    : kind === 'animal' ? [['Q', 'S'], ['Q', 'A'], ['Q', 'C'], ['S', 'A'], ['S', 'C'], ['A', 'C']]
      : kind === 'food' ? [['S', 'T'], ['O', 'S'], ['O', 'C'], ['T', 'C'], ['S', 'C']]
        : [['S', 'C'], ['A', 'C'], ['S', 'A'], ['Q', 'C'], ['Q', 'A']];
  if (kind === 'thing') cats.Q = cats.Q.filter(a => a !== 'magic'); // "magic" reads best on its own
  const [c1, c2] = pick(PAIRS, rng);
  const a1 = pick(ok(cats[c1]), rng);
  const a2 = pick(ok(cats[c2]).filter(a => a !== a1), rng);
  return [a1, a2];
}

function nounPhrase([num, art, nAdj], pool, rng, avoidNouns, avoidAdj) {
  const nouns = pool.filter(n => !avoidNouns.includes(n) && (num === 'sg' || PLURAL[n]));
  if (!nouns.length) return null;
  const noun = pick(nouns, rng);
  const adjs = adjectivesFor(kindOf(noun), nAdj, rng, avoidAdj);
  const word = num === 'pl' ? PLURAL[noun] : noun;
  const T = [];
  if (art) T.push({ w: num === 'pl' ? 'the' : articleFor(adjs[0] || word, rng), t: 'A' });
  adjs.forEach(a => T.push({ w: a, t: 'J' }));
  T.push({ w: word, t: 'N' });
  return { T, noun, adjs };
}

// Returns { tokens: [{w, t}], text: 'The dog runs.', pattern: id }
export function makeSentence(level, rng = Math.random, patternId = null) {
  const lv = Math.max(1, Math.min(5, level | 0));
  const options = PATTERNS.filter(p => (patternId ? p.id === patternId : p.level === lv));
  for (let attempt = 0; attempt < 20; attempt++) {
    const p = pick(options, rng);
    const subj = nounPhrase(p.s, ANIMATES, rng, [], []);
    const plural = p.s[0] === 'pl';
    let verb, obj = null;
    if (p.v === 'i') verb = pick(INTRANS, rng);
    else {
      verb = pick(TRANS, rng);
      const pool = VERB_OBJECTS[verb] || [...FOOD, ...THINGS];
      obj = nounPhrase(p.o, pool, rng, [subj.noun], subj.adjs);
      if (!obj) continue; // e.g. no plural objects for this verb – try again
    }
    const tokens = [...subj.T, { w: plural ? BASE[verb] : verb, t: 'V' }, ...(obj ? obj.T : [])];
    return { tokens, text: sentenceText(tokens), pattern: p.id };
  }
  // very unlikely fallback
  return makeSentence(1, rng, 1);
}

export function sentenceText(tokens) {
  const s = tokens.map(t => t.w).join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}
