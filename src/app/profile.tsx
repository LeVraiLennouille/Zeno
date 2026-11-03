import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const store = useStore();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(store.getState().db.profile.name);
  const save = (): void => {
    store.setName(name);
    router.back();
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: Math.max(insets.top, 20), gap: 16 }}>
      <AppText variant="title">Ton nom</AppText>
      <TextInput
        accessibilityLabel="Nom d'affichage"
        autoFocus
        value={name}
        onChangeText={setName}
        maxLength={40}
        onSubmitEditing={save}
        returnKeyType="done"
        placeholder="Comment t'appelle-t-on ?"
        placeholderTextColor={colors.text3}
        style={{ minHeight: 52, borderWidth: 2, borderRadius: 14, paddingHorizontal: 14, fontFamily: 'Instrument-Medium', fontSize: 17, color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.surface }}
      />
      <Button label="Enregistrer" onPress={save} />
      <Button label="Annuler" variant="outline" onPress={() => router.back()} />
    </View>
  );
}
