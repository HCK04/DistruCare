// ─────────────────────────────────────────────────────────────
// Distrucare — Système de thème (palette clinique claire)
// Palette pensée comme une vraie application médicale : fond clair,
// une seule couleur primaire calme, statuts sobres, ombres discrètes.
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // Fonds
  bg: '#F2F5F9',        // gris bleuté très clair (arrière-plan général)
  bgCard: '#FFFFFF',    // cartes blanches
  bgCardAlt: '#EAF0F6', // surface secondaire (champs, notes)
  bgModal: '#FFFFFF',

  // Couleur primaire (teal médical sobre)
  accent: '#0F766E',
  accentLight: '#0E7C72',
  accentDim: '#E2F1EF',

  // Statuts (teintes cliniques désaturées)
  taken: '#15803D',
  takenDim: '#E7F4EC',
  missed: '#B91C1C',
  missedDim: '#FBEAEA',
  late: '#B45309',
  lateDim: '#FBF0E1',

  // Texte
  textPrimary: '#102036',
  textSecondary: '#51607A',
  textMuted: '#9AA7BC',

  // Bordures
  border: '#E3E9F1',
  borderAccent: '#B7DED8',

  // Divers
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(16,32,54,0.45)',
};

// Conservée pour compatibilité, ramenée à une teinte unique sobre.
export const MedColors = ['#0F766E'];

// ── Typographie ──────────────────────────────────────────────
// Tailles de base. Le facteur d'agrandissement « gros caractères »
// est appliqué via makeFonts() (voir le contexte UISettings).
export const BaseFontSizes = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 42,
};

export const FontScale = {
  normal: 1,
  large: 1.32, // mode « confort visuel »
};

export type Fonts = typeof BaseFontSizes;

export function makeFonts(large: boolean): Fonts {
  const k = large ? FontScale.large : FontScale.normal;
  return {
    xs: Math.round(BaseFontSizes.xs * k),
    sm: Math.round(BaseFontSizes.sm * k),
    md: Math.round(BaseFontSizes.md * k),
    lg: Math.round(BaseFontSizes.lg * k),
    xl: Math.round(BaseFontSizes.xl * k),
    xxl: Math.round(BaseFontSizes.xxl * k),
    xxxl: Math.round(BaseFontSizes.xxxl * k),
  };
}

// Tailles par défaut (échelle normale) — pour les imports statiques.
export const FontSizes: Fonts = makeFonts(false);

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

// Ombres douces et neutres (pas de « glow »).
export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  accent: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
};
