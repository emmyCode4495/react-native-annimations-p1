import { brand } from './brand';

export type ThemeKey = 'brand' | 'midnight' | 'emerald' | 'sunset';

export const THEMES: Record<ThemeKey, { label: string; colors: [string, string, string] }> = {
  brand: { label: 'Tallyo', colors: [brand.colors.indigo, '#8250FF', brand.colors.coral] },
  midnight: { label: 'Midnight', colors: ['#2E3A7A', '#161E4D', '#0B1030'] },
  emerald: { label: 'Emerald', colors: ['#0B7F78', '#14A38B', '#37C98B'] },
  sunset: { label: 'Sunset', colors: ['#FFB547', '#FF7A59', '#FF4F87'] },
};

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
