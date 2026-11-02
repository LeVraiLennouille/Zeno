import Svg, { Line, Polyline } from 'react-native-svg';

/** Coche (✓) ou croix (✕) tracées comme dans la PWA. */
export function CheckMark({ color, size = 22, cross = false }: { readonly color: string; readonly size?: number; readonly cross?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      {cross ? (
        <>
          <Line x1="5" y1="5" x2="15" y2="15" />
          <Line x1="15" y1="5" x2="5" y2="15" />
        </>
      ) : (
        <Polyline points="4 10 8 14 16 6" />
      )}
    </Svg>
  );
}
