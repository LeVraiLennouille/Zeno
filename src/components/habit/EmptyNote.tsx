import { View } from 'react-native';

import { AppText } from '../ui/AppText';

/** Message centré (aucune habitude, jour de pause…). */
export function EmptyNote({ title, text, glyph }: { readonly title?: string; readonly text: string; readonly glyph?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 6 }}>
      {glyph ? <AppText variant="title">{glyph}</AppText> : null}
      {title ? <AppText variant="heading">{title}</AppText> : null}
      <AppText tone="text2" style={{ textAlign: 'center' }}>
        {text}
      </AppText>
    </View>
  );
}
