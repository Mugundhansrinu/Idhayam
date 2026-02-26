/**
 * IdhayamApp – Centralised Colour System
 * =========================================
 * All application colours live here.
 * Import `AppColors` and pick light/dark tokens as needed.
 */

// ─────────────────────────────────────────
//  Brand palette
// ─────────────────────────────────────────
export const BrandColors = {
  // Blue family
  blue900: '#0D1F5C',
  blue800: '#1A3C8F',   // Primary brand blue
  blue700: '#1E4DB7',
  blue600: '#2563EB',
  blue500: '#3B82F6',
  blue400: '#60A5FA',
  blue100: '#DBEAFE',

  // Yellow family
  yellow600: '#CA9E00',
  yellow500: '#F5C800',  // Primary brand yellow
  yellow400: '#FFD740',
  yellow100: '#FFF9C4',

  // Red family
  red700: '#B71C1C',
  red600: '#E3001B',    // Primary brand red
  red500: '#EF4444',
  red100: '#FEE2E2',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  grey50:  '#F8FAFC',
  grey100: '#F1F5F9',
  grey200: '#E2E8F0',
  grey300: '#CBD5E1',
  grey400: '#94A3B8',
  grey500: '#64748B',
  grey600: '#475569',
  grey700: '#334155',
  grey800: '#1E293B',
  grey900: '#0F172A',

  // Glass / overlay helpers (rgba strings)
  glassWhite: 'rgba(255, 255, 255, 0.18)',
  glassWhiteBorder: 'rgba(255, 255, 255, 0.35)',
  glassDark: 'rgba(15, 23, 42, 0.45)',
  glassDarkBorder: 'rgba(255, 255, 255, 0.12)',
  overlayLight: 'rgba(255, 255, 255, 0.08)',
  overlayDark: 'rgba(0, 0, 0, 0.25)',

  // Gradient stops
  gradientBlueStart: '#0D1F5C',
  gradientBlueMid:   '#1A3C8F',
  gradientBlueEnd:   '#1E4DB7',
  gradientAccent1:   '#E3001B',
  gradientAccent2:   '#F5C800',
  transparent: 'transparent',
} as const;

// ─────────────────────────────────────────
//  Semantic token types
// ─────────────────────────────────────────
export type ColorTokens = {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;

  // Glass card
  glassBackground: string;
  glassBorder: string;
  glassShadow: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnAccent: string;
  textLink: string;

  // Inputs
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
  inputPlaceholder: string;
  inputText: string;

  // Buttons
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonPrimaryGradientStart: string;
  buttonPrimaryGradientEnd: string;

  // Icons
  iconPrimary: string;
  iconSecondary: string;

  // Status
  success: string;
  error: string;
  warning: string;

  // Gradient definition (for LinearGradient)
  gradientColors: string[];

  // Toggle / misc
  toggleThumbOn: string;
  toggleTrackOn: string;
  divider: string;
};

// ─────────────────────────────────────────
//  Light theme tokens
// ─────────────────────────────────────────
export const LightColors: ColorTokens = {
  background: BrandColors.blue900,
  backgroundSecondary: BrandColors.blue800,
  surface: BrandColors.grey50,

  glassBackground: BrandColors.glassWhite,
  glassBorder: BrandColors.glassWhiteBorder,
  glassShadow: 'rgba(0,0,0,0.25)',

  textPrimary: BrandColors.white,
  textSecondary: BrandColors.blue100,
  textMuted: BrandColors.grey300,
  textOnPrimary: BrandColors.white,
  textOnAccent: BrandColors.blue900,
  textLink: BrandColors.yellow500,

  inputBackground: 'rgba(255,255,255,0.12)',
  inputBorder: 'rgba(255,255,255,0.25)',
  inputFocusBorder: BrandColors.yellow500,
  inputPlaceholder: 'rgba(255,255,255,0.55)',
  inputText: BrandColors.white,

  buttonPrimary: BrandColors.blue700,
  buttonPrimaryText: BrandColors.white,
  buttonSecondary: BrandColors.transparent,
  buttonSecondaryText: BrandColors.yellow500,
  buttonPrimaryGradientStart: BrandColors.blue700,
  buttonPrimaryGradientEnd: BrandColors.blue500,

  iconPrimary: BrandColors.white,
  iconSecondary: BrandColors.yellow500,

  success: '#22C55E',
  error: BrandColors.red600,
  warning: BrandColors.yellow500,

  gradientColors: [
    BrandColors.gradientBlueStart,
    BrandColors.gradientBlueMid,
    BrandColors.gradientBlueEnd,
  ],

  toggleThumbOn: BrandColors.yellow500,
  toggleTrackOn: BrandColors.blue600,
  divider: 'rgba(255,255,255,0.15)',
};

// ─────────────────────────────────────────
//  Dark theme tokens
// ─────────────────────────────────────────
export const DarkColors: ColorTokens = {
  background: BrandColors.grey900,
  backgroundSecondary: BrandColors.grey800,
  surface: BrandColors.grey800,

  glassBackground: BrandColors.glassDark,
  glassBorder: BrandColors.glassDarkBorder,
  glassShadow: 'rgba(0,0,0,0.55)',

  textPrimary: BrandColors.white,
  textSecondary: BrandColors.grey300,
  textMuted: BrandColors.grey400,
  textOnPrimary: BrandColors.white,
  textOnAccent: BrandColors.grey900,
  textLink: BrandColors.yellow400,

  inputBackground: 'rgba(255,255,255,0.07)',
  inputBorder: 'rgba(255,255,255,0.14)',
  inputFocusBorder: BrandColors.yellow400,
  inputPlaceholder: 'rgba(255,255,255,0.35)',
  inputText: BrandColors.white,

  buttonPrimary: BrandColors.blue700,
  buttonPrimaryText: BrandColors.white,
  buttonSecondary: BrandColors.transparent,
  buttonSecondaryText: BrandColors.yellow400,
  buttonPrimaryGradientStart: BrandColors.blue800,
  buttonPrimaryGradientEnd: BrandColors.blue600,

  iconPrimary: BrandColors.grey200,
  iconSecondary: BrandColors.yellow400,

  success: '#4ADE80',
  error: BrandColors.red500,
  warning: BrandColors.yellow400,

  gradientColors: [
    BrandColors.grey900,
    '#0D1832',
    '#0A0F24',
  ],

  toggleThumbOn: BrandColors.yellow400,
  toggleTrackOn: BrandColors.blue700,
  divider: 'rgba(255,255,255,0.08)',
};

// ─────────────────────────────────────────
//  Helper: pick the correct palette
// ─────────────────────────────────────────
export const AppColors = {
  brand: BrandColors,
  light: LightColors,
  dark: DarkColors,
  getColors: (isDark: boolean): ColorTokens => (isDark ? DarkColors : LightColors),
};

export default AppColors;
