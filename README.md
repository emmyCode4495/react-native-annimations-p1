# Tallyo — Animated Fintech Onboarding (React Native)

Premium, production-feel animated flow for a fintech product:

1. **Splash → Welcome** — Logo springs in, holds, then travels to the corner while the aurora intensifies and copy enters.
2. **Auth (Login / Sign up)** — Segmented control, floating focus fields, magnetic CTA, social buttons.
3. **Home** — Count-up balance, gradient cards carousel, quick actions, staggered transactions.

Built for content / marketing demos: every transition is intentional, haptic-backed, and easy to reskin via `src/brand.ts`.

## Stack

- Expo SDK 58 + Expo Router
- React Native Reanimated 4
- Shopify Skia (aurora background)
- Lottie (sparkle accent)
- expo-video (optional Higgsfield hero loop)
- expo-haptics + gesture-handler (magnetic button)

## Run

```bash
npm install
npx expo start
```

Tap the invisible top-right square on the welcome screen to replay the splash sequence (useful for recording).

## Flow

| Screen   | Route   | Key interactions                          |
|----------|---------|-------------------------------------------|
| Welcome  | `/`     | Splash hold → logo travel → Get started   |
| Auth     | `/auth` | Login ↔ Sign up toggle → social / CTA     |
| Home     | `/home` | Balance count-up, cards, transactions     |

## Reskin

Edit `src/brand.ts`:

- `name`, `headline`, `subline`, `cta`
- `colors` (ink, indigo, coral, accent, …)
- Optional: drop a muted 9:16 loop into `assets/higgsfield/hero.mp4` and set `assets.heroVideo`

## Optional Higgsfield hero

1. Generate a seamless 6–10s vertical loop (muted).
2. Place at `assets/higgsfield/hero.mp4`.
3. In `src/brand.ts`:

```ts
heroVideo: require('../assets/higgsfield/hero.mp4'),
```

The aurora becomes transparent so the video shows through.

## Project layout

```
src/
  app/           # Expo Router routes
  components/    # AuroraBackground, MagneticButton, HeroVideo
  screens/       # WelcomeScreen, AuthScreen, HomeScreen
  brand.ts       # Single source of brand tokens
assets/
  lottie/        # sparkle.json
  images/
```

## Recording tips

- Use the top-right replay hit area for clean takes.
- Dark mode only — designed for OLED demos.
- Magnetic button feels best on device (haptics + large touch zone).
