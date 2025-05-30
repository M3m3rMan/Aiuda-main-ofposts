// Colors.ts

export const LAUSD_BLUE = '#005A9C';
export const LAUSD_GOLD = '#FFC72C';
export const LAUSD_ORANGE = '#FF6F00';

const tintColorLight = LAUSD_BLUE;
const tintColorDark = '#ffffff';

export default {
  light: {
    text: '#000000',
    background: '#ffffff',
    tint: tintColorLight,
    tabIconDefault: '#cccccc',
    tabIconSelected: LAUSD_GOLD,
    primary: LAUSD_BLUE,
    secondary: LAUSD_GOLD,
    accent: LAUSD_ORANGE,
  },
  dark: {
    text: '#ffffff',
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#888888',
    tabIconSelected: LAUSD_GOLD,
    primary: LAUSD_BLUE,
    secondary: LAUSD_GOLD,
    accent: LAUSD_ORANGE,
  },
};
