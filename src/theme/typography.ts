import type { TextStyle } from 'react-native';

import type { FontFamilyName } from './fonts';

export type TextVariant = 'hero' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'label';

interface VariantStyle {
  readonly fontFamily: FontFamilyName;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing?: number;
  readonly textTransform?: TextStyle['textTransform'];
}

/** Échelle typographique. Les tailles « chiffre géant » seront adaptées à la largeur d'écran par les écrans (ancien `clamp()`). */
export const TEXT_VARIANTS: Readonly<Record<TextVariant, VariantStyle>> = {
  hero: { fontFamily: 'Bricolage-ExtraCondensedExtraBold', fontSize: 88, lineHeight: 88, letterSpacing: -2 },
  title: { fontFamily: 'Bricolage-CondensedBold', fontSize: 28, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: 'Bricolage-CondensedBold', fontSize: 20, lineHeight: 24 },
  subheading: { fontFamily: 'Bricolage-CondensedExtraBold', fontSize: 16, lineHeight: 20 },
  body: { fontFamily: 'Instrument-Regular', fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: 'Instrument-SemiBold', fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: 'Instrument-Medium', fontSize: 12, lineHeight: 16 },
  label: { fontFamily: 'Instrument-Bold', fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
};
