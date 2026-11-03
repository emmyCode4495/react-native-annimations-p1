// One file to reskin the whole day. Swap these for the next demo brand
// (food delivery, fitness, store) when you reply to comments with niche variants.
// Check the name doesn't clash with a real product before you post.

export const brand = {
  name: 'Tallyo',
  headline: ['Money that moves', 'at your speed.'],
  subline: 'Send, save and spend in one place. No hidden fees.',
  cta: 'Get started',
  colors: {
    ink: '#070D22',
    indigo: '#4F5BFF',
    coral: '#FF6B9A',
    accent: '#FFC857',
    onAccent: '#1A1405',
    text: '#EEF2FF',
    muted: '#9AA6D1',
    // surfaces and states used by auth + home
    card: 'rgba(255,255,255,0.06)',
    stroke: 'rgba(255,255,255,0.14)',
    success: '#3DDC97',
    danger: '#FF5C7A',
  },
};

export const assets = {
  // Lottie accent. Replace with any file from LottieFiles (check its license).
  lottieSparkle: require('../assets/lottie/sparkle.json'),
  // Button-to-checkmark confirmation with a burst ring (generated, see scripts/make_success_lottie.py)
  lottieSuccess: require('../assets/lottie/success.json'),

  // Higgsfield hero loop (9:16, muted, 6-10s, seamless). Leave null until you have the clip,
  // then use: require('../assets/higgsfield/hero.mp4')
  heroVideo: null as number | null,
};
