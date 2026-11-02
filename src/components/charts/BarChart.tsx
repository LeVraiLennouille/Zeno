import { StyleSheet, View } from 'react-native';

import type { Bucket } from '@/domain';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';

/** Histogramme du taux de réussite : la barre du jour est pleine, les autres teintées. */
export function BarChart({ buckets, year }: { readonly buckets: readonly Bucket[]; readonly year: boolean }) {
  const { colors } = useTheme();
  const dense = buckets.length > 12;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Histogramme de réussite : ${buckets.filter((b) => b.req > 0).map((b) => `${b.label} ${b.cnt} sur ${b.req}`).join(', ')}`}
      style={[styles.chart, { gap: dense ? 2 : 6 }]}
    >
      {buckets.map((b, i) => {
        const pct = b.rate == null ? 0 : Math.max(b.rate > 0 ? 5 : 3, Math.round(b.rate * 100));
        return (
          <View key={`${b.label}-${i}`} style={styles.col}>
            <View style={styles.track}>
              <View
                style={{
                  height: `${pct}%`,
                  borderRadius: dense ? 3 : 6,
                  backgroundColor: b.isToday ? colors.accent : colors.accentBg,
                }}
              />
            </View>
            <AppText variant="caption" tone="text3" style={styles.label} numberOfLines={1}>
              {b.showLabel ? (year ? b.barLabel : b.label) : ' '}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', height: 150, alignItems: 'stretch' },
  col: { flex: 1, minWidth: 0 },
  track: { flex: 1, justifyContent: 'flex-end' },
  label: { textAlign: 'center', fontSize: 10, lineHeight: 16, marginTop: 4 },
});
