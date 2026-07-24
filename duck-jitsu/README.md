# Duck Jitsu 🦆

A 1v1 elemental card battle game for mobile, inspired by the energy of Club Penguin's
Card-Jitsu minigame but reskinned end-to-end with an original duck/dojo art style, card set,
and UI. Every visual (duck avatars, cards, icons, animations) is drawn in code with
`react-native-svg` + `react-native-reanimated` — no copied assets.

## Monorepo layout

```
duck-jitsu/
  packages/
    engine/   Pure TypeScript game rules shared by server and client (no I/O)
    server/   Express + SQLite + Socket.IO backend (accounts, packs, shop, matchmaking, battles)
    app/      Expo (React Native) mobile client
```

### `packages/engine`

The rulebook, with nothing else mixed in — deterministic, unit-tested, and imported by both the
server (authoritative simulation) and the client (types + a few pure helpers). Covers:

- Card catalog: 3 elements × 6 colors across 8 Arenas, plus 4 gated Special Cards
- Turn resolution: the water→fire→ice→water cycle, rarity/level tiebreaks, full-tie draws
- Win-condition detection: "3 of one element, different colors" and "1 of each element,
  different colors"
- Match state machine (hands/decks/collected piles), with a proven-by-test scripted tutorial
  opponent that always loses by turn 2
- Weighted AI opponent (biases toward countering your last-played element)
- Pack odds/rolling, arena-gated card unlocks, card leveling costs, daily-seeded shop rotation,
  ranked matchmaking (trophy-range widening with wait time)

Run `npm run test:engine` — 63 tests.

### `packages/server`

- REST API: auth (email/password + guest), profile, catalog/arenas (locked cards are **never**
  serialized to a client past their own arena tier), packs, shop, card leveling, leaderboard,
  match history, IAP (mock — see below), practice/tutorial matches
- Socket.IO: casual/ranked queues (trophy-range widens the longer you wait), authoritative
  server-run battles, disconnect-forfeit handling
- SQLite via `better-sqlite3`; `:memory:` in tests, a file under `data/` in dev

Run `npm run test:server` — 37 tests, including two that drive a full two-socket PvP match
end-to-end over real WebSocket connections.

### `packages/app`

Expo/React Native client: auth, an interactive tap-to-continue onboarding tutorial (guaranteed
win, then a real starter-pack opening, then an arena walkthrough), Arena home, Shop (unlocked/
unowned cards only, falls back to duplicate/currency offers once everything's owned, plus
purchasable packs with disclosed odds), Battle (practice/casual/ranked), Leaderboard/Match
History, Profile (avatar customization, remove-ads + gem IAP).

## Running it locally

```bash
npm install                      # from the duck-jitsu/ root — installs all 3 workspaces

npm run dev:server               # starts the API + sockets on :4000

# in another shell:
cd packages/app
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000 npx expo start
```

Scan the QR code with Expo Go, or press `w` for the web target, `i`/`a` for iOS/Android
simulators.

## Testing

```bash
npm test              # engine + server unit/integration tests (100 tests)
npm run typecheck      # all three packages
```

The mobile client doesn't have an automated test suite (React Native UI testing needs a
device/simulator); it was verified by bundling with Metro and driving it end-to-end in a
headless browser (guest sign-up → tutorial → starter pack → arena/shop/rankings/profile →
practice match → post-match ad break) with no console errors.

## Monetization notes (for productionizing)

- `packages/server/src/routes/iap.ts` and the client's ad break/IAP UI are **mock**
  implementations. Before shipping: verify Apple App Store Server API / Google Play Developer
  API purchase receipts server-side, and swap in a real ad SDK (AdMob/Unity Ads/etc).
- Pack odds are disclosed in both the shop UI and the `/packs` API response, per store policy.
