/**
 * Tokens de design « Encre », repris des variables CSS de la PWA (`style.css`).
 * Interface noir et blanc : la couleur appartient aux habitudes (les 9 encres).
 */
export interface ThemeColors {
  readonly bg: string;
  readonly surface: string;
  readonly surface2: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly text: string;
  readonly text2: string;
  readonly text3: string;
  readonly accent: string;
  readonly onAccent: string;
  readonly accentText: string;
  readonly accentBg: string;
  readonly dockBg: string;
  readonly dockFg: string;
  readonly success: string;
  readonly danger: string;
  readonly orange: string;
  /** Texte posé sur une encre colorée (toujours foncé, même en thème sombre). */
  readonly inkText: string;
}

export const lightColors: ThemeColors = {
  bg: '#EDEEF0',
  surface: '#FFFFFF',
  surface2: '#F5F6F7',
  border: '#D8DADF',
  borderStrong: '#B3B6BF',
  text: '#12131A',
  text2: '#565862',
  text3: '#8A8D97',
  accent: '#12131A',
  onAccent: '#FFFFFF',
  accentText: '#12131A',
  accentBg: 'rgba(18,19,26,0.1)',
  dockBg: '#12131A',
  dockFg: '#EDEEF0',
  success: '#178A57',
  danger: '#D63A3A',
  orange: '#B8480C',
  inkText: '#12131A',
};

export const darkColors: ThemeColors = {
  bg: '#0E0F13',
  surface: '#181A21',
  surface2: '#20222B',
  border: '#2B2E39',
  borderStrong: '#464A59',
  text: '#F0EFEA',
  text2: '#A3A6B2',
  text3: '#70737F',
  accent: '#F0EFEA',
  onAccent: '#0E0F13',
  accentText: '#F0EFEA',
  accentBg: 'rgba(240,239,234,0.12)',
  dockBg: '#F0EFEA',
  dockFg: '#0E0F13',
  success: '#4ADE99',
  danger: '#FF7A7A',
  orange: '#FF9A5C',
  inkText: '#12131A',
};

/** Les 9 encres (identiques en clair et en sombre). */
export const INK_COLORS = [
  '#8EA2FF', '#C79BFF', '#FFD23F', '#52E0A1', '#FF8A4C',
  '#2EC4B6', '#52C7F2', '#FF7EB0', '#C3E34A',
] as const;

export const radius = { lg: 24, md: 16, sm: 12 } as const;

export const layout = {
  dockHeight: 64,
  /** Largeur maximale du contenu sur grand écran (navigateur). */
  contentMaxWidth: 560,
} as const;

/** Ombre dure décalée, signature visuelle de l'interface (sans flou). */
export const hardShadow = (color: string, offset = 4) =>
  ({ boxShadow: `${offset}px ${offset}px 0px 0px ${color}` }) as const;
