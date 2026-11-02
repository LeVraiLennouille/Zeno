import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';

/** Carte de la page Rapport : titre, badge à droite, contenu. */
export function ReportCard({ title, badge, children }: { readonly title: string; readonly badge?: ReactNode; readonly children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Card shadow={false} style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <AppText variant="heading" style={{ flexShrink: 1 }}>
          {title}
        </AppText>
        {typeof badge === 'string' ? (
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.accentBg }}>
            <AppText variant="caption">{badge}</AppText>
          </View>
        ) : (
          badge
        )}
      </View>
      {children}
    </Card>
  );
}
