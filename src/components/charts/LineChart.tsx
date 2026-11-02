import { useId, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { chartRuns, MOOD_EMOJIS, type SeriesPoint } from '@/domain';
import { useTheme } from '@/theme';

interface Pad {
  readonly l: number;
  readonly r: number;
  readonly t: number;
  readonly b: number;
}

export interface LineChartProps {
  readonly points: readonly SeriesPoint[];
  readonly yMin: number;
  readonly yMax: number;
  /** Valeurs des lignes de grille (étiquetées si `formatGrid`). */
  readonly grid: readonly number[];
  readonly formatGrid?: (v: number) => string;
  readonly height: number;
  readonly pad: Pad;
  /** Rayon des points, selon la densité. */
  readonly dotRadius: number;
  /** Affiche l'emoji d'humeur au-dessus des points qui le demandent. */
  readonly emojis?: boolean;
  readonly label: string;
}

/** Courbe SVG avec aire dégradée ; les valeurs absentes interrompent le tracé. */
export function LineChart({ points, yMin, yMax, grid, formatGrid, height, pad, dotRadius, emojis = false, label }: LineChartProps) {
  const { colors, scheme } = useTheme();
  const [width, setWidth] = useState(0);
  const gradientId = `g${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const runs = useMemo(() => chartRuns(points), [points]);

  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (i: number): number => pad.l + (points.length > 1 ? i / (points.length - 1) : 0.5) * innerW;
  const y = (v: number): number => pad.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const gridColor = scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = scheme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const bottom = pad.t + innerH;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.16} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {grid.map((g) => (
            <Line key={g} x1={pad.l} x2={width - pad.r} y1={y(g)} y2={y(g)} stroke={gridColor} strokeWidth={1} />
          ))}
          {formatGrid
            ? grid.map((g) => (
                <SvgText key={`t${g}`} x={pad.l - 6} y={y(g) + 4} fontSize={10} fill={textColor} textAnchor="end">
                  {formatGrid(g)}
                </SvgText>
              ))
            : null}
          {runs.length === 0 ? (
            <SvgText x={width / 2} y={height / 2} fontSize={12} fill={textColor} textAnchor="middle">
              Pas encore de données sur cette période
            </SvgText>
          ) : (
            runs.map((run, n) => {
              const line = run.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.index).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
              const first = run[0];
              const last = run[run.length - 1];
              return (
                <G key={n}>
                  {first && last && run.length > 1 ? (
                    <>
                      <Path d={`${line} L${x(last.index).toFixed(1)} ${bottom} L${x(first.index).toFixed(1)} ${bottom} Z`} fill={`url(#${gradientId})`} />
                      <Path d={line} stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
                    </>
                  ) : null}
                  {run.map((p) => (
                    <Circle key={p.index} cx={x(p.index)} cy={y(p.v)} r={dotRadius} fill={colors.accent} />
                  ))}
                </G>
              );
            })
          )}
          {points.map((p, i) =>
            p.showLabel ? (
              <SvgText key={`l${i}`} x={x(i)} y={height - 4} fontSize={10} fill={textColor} textAnchor="middle">
                {p.label}
              </SvgText>
            ) : null,
          )}
          {emojis
            ? points.map((p, i) =>
                p.v != null && p.emoji ? (
                  <SvgText key={`e${i}`} x={x(i)} y={y(p.v) - 8} fontSize={14} textAnchor="middle">
                    {MOOD_EMOJIS[Math.round(p.v)] ?? ''}
                  </SvgText>
                ) : null,
              )
            : null}
        </Svg>
      ) : null}
    </View>
  );
}

/** Courbe du taux de réussite : 0-100 %, grille tous les 20 %. */
export const RATE_CHART = {
  yMin: 0,
  yMax: 100,
  grid: [0, 20, 40, 60, 80, 100],
  formatGrid: (v: number): string => `${v}%`,
  height: 160,
  pad: { l: 36, r: 16, t: 20, b: 28 },
} as const;

/** Courbe d'humeur : de 1 à 5. */
export const MOOD_CHART = {
  yMin: 1,
  yMax: 5,
  grid: [] as readonly number[],
  height: 100,
  pad: { l: 16, r: 16, t: 16, b: 24 },
} as const;
