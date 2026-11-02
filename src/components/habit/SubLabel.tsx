import { View } from 'react-native';

import type { SubSegment } from '@/domain';
import { Icon } from '@/icons/Icon';

import { AppText } from '../ui/AppText';

/** Sous-titre d'une carte : texte, flamme de série et pastilles « X fois par semaine ». */
export function SubLabel({ segments, color }: { readonly segments: readonly SubSegment[]; readonly color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
      {segments.map((s, i) => {
        if (s.kind === 'text') {
          return (
            <AppText key={i} variant="caption" style={{ color }}>
              {s.text}
            </AppText>
          );
        }
        if (s.kind === 'flame') return <Icon key={i} name="flame" size={13} color={color} />;
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: s.total }, (_, n) => (
              <View
                key={n}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: color,
                  backgroundColor: n < s.filled ? color : 'transparent',
                }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
