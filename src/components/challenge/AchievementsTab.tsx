import { View } from 'react-native';

import { achievementsModel } from '@/domain';
import { useModel } from '@/state/react';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

export function AchievementsTab() {
  const m = useModel(achievementsModel);
  const { colors } = useTheme();
  return (
    <View style={{ gap: 20 }}>
      <Card shadow={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <AppText variant="bodyStrong">Succès débloqués</AppText>
          <AppText variant="bodyStrong">
            {m.unlocked} / {m.total}
          </AppText>
        </View>
        <ProgressBar pct={m.pct} label="Succès débloqués" />
      </Card>
      {m.sections.map((section) => (
        <View key={section.label} style={{ gap: 10 }}>
          <AppText variant="label" tone="text3">
            {section.label}
          </AppText>
          {section.items.map((a) => (
            <View
              key={a.id}
              accessible
              accessibilityLabel={`${a.name}, ${a.unlocked ? 'débloqué' : 'verrouillé'}. ${a.desc}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: a.unlocked ? colors.text : colors.border,
                backgroundColor: colors.surface,
                opacity: a.unlocked ? 1 : 0.55,
              }}
            >
              <AppText variant="title">{a.unlocked ? a.emoji : '🔒'}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="heading">{a.name}</AppText>
                <AppText variant="caption" tone="text2">
                  {a.desc}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
