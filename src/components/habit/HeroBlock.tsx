import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { heroDateLabel, heroModel } from '@/domain';
import { useModel } from '@/state/react/StoreProvider';
import { layout, useTheme } from '@/theme';

import { AppText } from '../ui/AppText';

/** Bandeau du jour : date, score géant, légende, niveau et bande d'encre (une case par habitude). */
export function HeroBlock() {
  const hero = useModel(heroModel);
  const date = useModel(heroDateLabel);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  // Équivalent de clamp(5.5rem, 31vw, 8.5rem), plafonné à la largeur du contenu.
  const size = Math.round(Math.min(136, Math.max(88, Math.min(width, layout.contentMaxWidth) * 0.31)));
  const caption = hero.paused ? 'Jour de pause · séries gelées' : hero.perfect ? 'Journée parfaite' : 'habitudes faites';
  return (
    <View>
      <AppText variant="body" tone="text2" style={styles.date}>
        {date}
      </AppText>
      <View style={styles.score}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${hero.done} habitudes sur ${hero.required}`}
          style={styles.count}
        >
          <AppText
            variant="hero"
            style={{ fontSize: size, lineHeight: Math.round(size * 0.9), color: hero.perfect ? colors.success : colors.text }}
          >
            {hero.done}
          </AppText>
          <AppText variant="hero" tone="text2" style={{ fontSize: Math.round(size * 0.36), lineHeight: Math.round(size * 0.5) }}>
            /{hero.required}
          </AppText>
        </View>
        <View style={styles.side}>
          <AppText variant="heading" style={styles.caption}>
            {caption}
          </AppText>
          <AppText variant="caption" tone="text2">
            Niv. {hero.level} · {hero.levelName}
          </AppText>
        </View>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.strip}>
        {hero.segments.map((seg, i) => (
          <View key={`${seg.name}-${i}`} style={[styles.seg, { borderColor: seg.color }]}>
            <View style={{ width: `${Math.round(seg.progress * 100)}%`, height: '100%', backgroundColor: seg.color }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  date: { textTransform: 'capitalize' },
  score: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 2 },
  count: { flexDirection: 'row', alignItems: 'baseline' },
  side: { alignItems: 'flex-end', paddingBottom: 6, flexShrink: 1 },
  caption: { textAlign: 'right' },
  strip: { flexDirection: 'row', gap: 5, marginTop: 18 },
  seg: { flex: 1, height: 16, borderRadius: 8, borderWidth: 2, overflow: 'hidden' },
});
