/**
 * Polices statiques générées depuis les polices variables de la PWA : React Native
 * ne pilote pas les axes de largeur (`font-stretch`), chaque combinaison utilisée
 * dans `style.css` est donc un fichier distinct. Ne pas combiner avec `fontWeight`.
 */
export const FONT_FILES = {
  'Bricolage-ExtraCondensedExtraBold': require('../../assets/fonts/BricolageGrotesque-ExtraCondensedExtraBold.ttf'),
  'Bricolage-CondensedExtraBold': require('../../assets/fonts/BricolageGrotesque-CondensedExtraBold.ttf'),
  'Bricolage-CondensedBold': require('../../assets/fonts/BricolageGrotesque-CondensedBold.ttf'),
  'Bricolage-ExtraBold': require('../../assets/fonts/BricolageGrotesque-ExtraBold.ttf'),
  'Bricolage-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),
  'Instrument-Regular': require('../../assets/fonts/InstrumentSans-Regular.ttf'),
  'Instrument-Medium': require('../../assets/fonts/InstrumentSans-Medium.ttf'),
  'Instrument-SemiBold': require('../../assets/fonts/InstrumentSans-SemiBold.ttf'),
  'Instrument-Bold': require('../../assets/fonts/InstrumentSans-Bold.ttf'),
} as const;

export type FontFamilyName = keyof typeof FONT_FILES;
