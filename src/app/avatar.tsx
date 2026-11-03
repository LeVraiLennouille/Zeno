import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { AVATAR_DEFAULT, AVATAR_EMOJIS, avatarEmoji } from '@/domain';
import { useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

export default function AvatarScreen() {
  const store = useStore();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const current = avatarEmoji(store.getState().db);
  const [value, setValue] = useState(current);

  const choose = (emoji: string | null): void => {
    store.setAvatar(emoji);
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: Math.max(insets.top, 20), gap: 16, paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title">Ton avatar</AppText>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          accessibilityLabel="Emoji de l’avatar"
          value={value}
          onChangeText={setValue}
          maxLength={16}
          style={{ flex: 1, minHeight: 52, borderWidth: 2, borderRadius: 14, paddingHorizontal: 14, fontSize: 22, color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.surface }}
        />
        <Button label="Utiliser" onPress={() => choose(value)} />
      </View>
      <AppText variant="caption" tone="text2">
        Tape un emoji ou choisis-en un.
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AVATAR_EMOJIS.map((e) => (
          <Pressable
            key={e}
            accessibilityRole="button"
            accessibilityLabel={`Emoji ${e}`}
            accessibilityState={{ selected: current === e }}
            onPress={() => choose(e)}
            style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: current === e ? colors.text : colors.border }}
          >
            <Text style={{ fontSize: 26 }}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Chip label={`Emoji par défaut ${AVATAR_DEFAULT}`} selected={false} onPress={() => choose(null)} />
      </View>
    </ScrollView>
  );
}
