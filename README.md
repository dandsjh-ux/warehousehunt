# Escape Warehouse

A multiplayer 3D hide-and-seek word game for Year 3 and 4. Hiders sneak around a dark warehouse collecting words to build a sentence, then race to the exit. The seeker hunts them down.

Built with **three.js** (3D, third-person camera) and **Socket.IO** (real-time multiplayer). Works in any modern browser on laptops, Chromebooks and tablets (touch controls included).

## How the game works

- The warehouse has **two floors**, a **Ground floor** and a **Basement**, joined by **three stairways** (west, east and south). It is very dark, with narrow aisles between full-height shelving that blocks sight completely, so hiders can slip away and the seeker has to search.
- Room entrances are kept clear of crates, and anyone (hider or seeker) can **climb over** low crates and sandbags with the action key, which makes for good shortcuts and escape routes.
- **Room alarm:** the moment a seeker steps into a word room (or stands in its doorway), every hider gets a flashing "ALARM! The seeker is in the Verb Basement" banner and a beep. The room's lamp flashes red, the seeker shows on the minimap with an arrow, and the alarm clears when they leave. Camping at a room no longer works quietly.
- **Vending machines:** one on each floor, beside the prison. Free hiders earn **1 point every second** and **10 points per word** (points reset each round). Walk up and press **E** to open the menu:
  - **Buy a word: 100 points.** Fills in your next missing word.
  - **Taser: 45 points, one shot.** A crosshair appears; aim with the camera and press **Q** (or E / left-click when nothing else is in reach). It hits a seeker within 12 m in line of sight (shelves block it) and freezes them for 3 seconds. A miss still uses it up.
  - **Can of oil: 45 points, one use.** Press **G** to drop it just behind you. The next seeker to step on it skids and is stuck for 3 seconds. Hiders don't slip.
  - You can carry one taser and one oil at a time. A stunned seeker can't move, tag or search lockers.
- **Hiders** each get a sentence, e.g. *The dog runs.* Every word lives in its own room:
  - **Article Room** (yellow, ground floor): a, an, the
  - **Noun Hall** (blue, ground floor): naming words
  - **Adjective Gallery** (green, basement): describing words
  - **Verb Basement** (red, basement): doing words
- Every sentence needs at least one trip downstairs. The panel under the minimap tells hiders which floor they're on and which rooms they still need on the other floor.
- Walk up to a word table and press **E** to pick a word up. Words are read aloud.
- With all the words collected, the **EXITS** turn green. There is **one on each floor** (ground floor: north wall; basement: south-west corner), so the seeker can't guard both. A green arrow points to the exit on your floor. Reach either one to escape.
- The **Seeker** counts with the screen blacked out, then hunts. Touching a hider tags them. Seekers can also search hiding lockers.
- The **locator ping** shows the seeker red arrows and beams pointing at every hider for a few seconds, labelled with distance and "(downstairs)" or "(upstairs)". It's fair both ways: at the same moment, every pinged hider sees where the **seeker** is, with a red arrow and beam on screen and a flashing marker on the minimap, so they can plan their route.
- **"Seeker is near" warning:** when the seeker is close on the same floor (10 m by default), hiders see a flashing red banner and hear a heartbeat. The edge of the screen glows red on the side the seeker is coming from. Under half that distance it changes to "SEEKER IS VERY CLOSE – HIDE!".
- Everyone has a **torch** (F). Hiders can switch theirs off to stay hidden, but then they can barely see.
- **3+ players:** tagged hiders go to **Prison**. A free hider can open the prison door to rescue everyone inside.
- **2 players (duel):** a tag is an instant win for the seeker, an escape is an instant win for the hider, then roles swap.
- **1 player:** practice mode with no seeker.
- **24 sentence patterns** (singular and plural, with or without articles, adjectives before the subject or the object) and a word bank of 120 nouns, 88 verbs and 47 adjectives give thousands of different sentences, so rounds rarely repeat. Plurals teach agreement: *The dog runs* but *The dogs run*.
- Rooms include **near-miss words** on purpose. If you need "runs", "run" may be on the next table, and picking it up gives a hint to check the ending.
- Colour adjectives only ever describe animals, robots and things, never people. Two adjectives always follow natural English order (*the big brown dog*, *a grumpy old king*).
- Sentences get longer every round (if *Harder each round* is on). Each level mixes several patterns:

| Level | Patterns | Examples |
|---|---|---|
| 1 | 3 | The dog runs. · The dogs run. · Frogs jump. |
| 2 | 5 | A happy cat sleeps. · Hungry frogs jump. · The baby wants cookies. · Monkeys like bananas. |
| 3 | 5 | The girl kicks a ball. · The boys kick a ball. · The king eats red apples. · The sleepy little cat yawns. |
| 4 | 6 | The brave pirate finds a key. · A girl paints the green kite. · The hungry lion eats juicy apples. |
| 5 | 5 | The big brown dog eats a red apple. · The grumpy old king eats big juicy apples. |

*a* / *an* is always chosen correctly from the next word, so sentences model the rule.

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | W A S D or arrows | Left side of the screen (joystick) |
| Look | Click the game, then move the mouse | Drag on the right side |
| Run | Shift | Run button |
| Crouch (hide behind low crates) | C | Crouch button |
| Pick up word / hide / search / rescue / escape | E (or Space) | Action button |
| Climb over a low crate or sandbags | E when you're pressed up against one | Action button |
| Vending machine menu | E at the machine, then 1 / 2 / 3 | Action button, then tap |
| Fire taser | Q (or left-click) | Taser button |
| Drop oil | G | Oil button |
| Torch on/off | F | Torch button |
| Scores | Tab | Scores button |
| Menu (sound, read-aloud, brightness, leave) | Esc | II button |

If a classroom screen or projector makes the warehouse too dark to play, the host can pick **Darkness: Dim**, and each player can raise **Brightness** in the in-game menu.

## Host options

Rounds, round time, starting level, harder-each-round, word-type colour hints (always / first two rounds / never), seeker count-down, locator ping interval and duration, whether the ping also shows hiders the seeker, the "seeker is near" warning distance (off / 6 / 10 / 14 m), room alarm on/off, vending machines on/off, seeker speed, 1 or 2 seekers, prison rescues, hiding lockers and max locker time, hider torches, minimap, and darkness. The lobby also has three presets: *Easier (Year 3)*, *Standard* and *Challenge (Year 4)*.

Players customise their character (boy, girl or robot; outfit including a ninja; skin; hair style and colour; clothes colours; hat) on the start screen or in the lobby.

## Deploy: GitHub → Render

1. Create a new GitHub repository and upload everything in this folder (keep the folder structure; `node_modules` is not needed).
2. Go to [render.com](https://render.com) → **New** → **Web Service** → connect the repository.
3. Use these settings (Render reads them from `render.yaml` if you choose **Blueprint** instead):
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free is fine for a class
4. Click **Create Web Service**. When it says *Live*, open the URL.
5. One person clicks **Create a new game** and shares the 4-letter code (or the invite link). Everyone else types the code and clicks **Join**.

Render's free plan sleeps after about 15 minutes without visitors; the first visit afterwards takes up to a minute to wake. Open the link a few minutes before the lesson.

## Run it on your own computer

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm start
```

Open <http://localhost:3000>. Other devices on the same Wi-Fi can join at `http://YOUR-COMPUTER-IP:3000`.

## Customising

- **Words:** edit the lists in `public/shared/words.js`. Keep each word in only one list. Add a noun's plural to `PLURAL`, and a verb's plural form to `BASE` (*runs → run*). `VERB_OBJECTS` keeps sentences sensible (only food can be eaten). `PATTERNS` holds the 24 sentence shapes.
- **Map:** edit the `GROUND` and `BASEMENT` grids in `public/shared/map.js`. Each character is a 1.6 m square; the key is at the top of the file. Keep every row 36 characters wide. Stairways are the `v` cells: they must sit in the same cells on both floors, be walled in on both sides, and be listed in `STAIRS`. The ground floor enters at the north end of a stairway and the basement exits at the south end.
- **Host option choices:** `public/shared/settings.js`. Prices, points per second/word, stun time and taser range are in `SHOP` in the same file.

## Files

```
server.js                 Express + Socket.IO game server (rooms, rounds, tags, prison, pings)
render.yaml               Render deployment settings
public/index.html         Menus, lobby, HUD and styles
public/js/main.js         Client: controls, camera, networking, HUD
public/js/world.js        Builds the 3D warehouse from the map grid
public/js/character.js    Customisable characters and animation
public/js/audio.js        Sound effects and read-aloud
public/shared/            Map, word lists and settings (used by server and browser)
screenshots/              Floor plan and images from a test game
```

three.js is served from `node_modules` by the server, so the game doesn't depend on a CDN that a school network might block. (Fonts come from Google Fonts and fall back to system fonts if blocked.)
