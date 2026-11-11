import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { INK_COLORS } from '@/theme';

const LETTER_PATHS = [
  'M0 43.75V0H187C187 0 183.26 80.625 92.2533 83.125V93.125L187 81.25V125H0C0 125 1.24667 58.75 80.41 41.875V31.875L0 43.75Z',
  'M394 0H207V125H394C394 84.9997 394 81.25 361.587 81.25H284.293V70H379.04V55H284.293V43.75H361.587C394 43.7497 394 39.9997 394 0Z',
  'M601 0V125H518.72L512.487 102.5C510.675 95.9615 507.95 87.6786 501.267 88.75C495.243 89.7157 493.787 96.3834 493.787 102.5V125H414V0H495.033L500.643 22.5004C502.322 29.2313 505.687 37.5356 512.487 36.25C518.481 35.1166 519.967 28.6166 519.967 22.5V0H601Z',
  'M714.834 0C808.583 1.53656e-10 808.584 0.000304185 808.584 62.5V125H714.834C621.084 125 621.084 125 621.084 62.5C620.895 62.5 621.084 0 621.084 0C621.316 0.00123408 714.834 0.499167 714.834 0ZM696.084 56.25V68.75H733.584V56.25H696.084Z',
] as const;

/** Logo « ZENO » de l'en-tête : lettres pleines + ombre dure jaune (même rendu que `header-logo` de la PWA). */
export function Logo({ color, height = 44 }: { readonly color: string; readonly height?: number }) {
  const width = Math.round((height * 824) / 140);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Zeno" style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 824 140" fill="none">
        <G transform="translate(15 15)" fill={INK_COLORS[2]}>
          {LETTER_PATHS.map((d) => (
            <Path key={`s-${d.length}-${d.slice(0, 12)}`} d={d} />
          ))}
        </G>
        <G fill={color}>
          {LETTER_PATHS.map((d) => (
            <Path key={`l-${d.length}-${d.slice(0, 12)}`} d={d} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
