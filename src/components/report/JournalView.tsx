import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { JOURNAL_MORE, JOURNAL_PAGE, journalModel } from '@/domain';
import { confirmAsync } from '@/services/confirm';
import { notify } from '@/services/toast';
import { useCtx, useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

/** Journal : notes datées, recherche (dès 3 notes), « Voir plus ». */
export function JournalView() {
  const ctx = useCtx();
  const store = useStore();
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(JOURNAL_PAGE);
  const m = journalModel(ctx, query, limit);

  const remove = async (date: (typeof m.entries)[number]['date']): Promise<void> => {
    if (!(await confirmAsync('Supprimer cette note ?', 'L’humeur du jour est conservée.', 'Supprimer', true))) return;
    store.deleteJournalNote(date);
    notify('Note supprimée', 'trash', 2200);
  };

  return (
    <View style={{ gap: 12 }}>
      {m.showSearch ? (
        <TextInput
          accessibilityLabel="Rechercher dans le journal"
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher dans le journal"
          placeholderTextColor={colors.text3}
          style={{ minHeight: 44, borderWidth: 2, borderRadius: 14, paddingHorizontal: 14, fontFamily: 'Instrument-Medium', fontSize: 15, color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.surface }}
        />
      ) : null}
      {m.emptyText ? (
        <AppText tone="text2">{m.emptyText}</AppText>
      ) : (
        m.entries.map((e) => (
          <View key={e.date} style={{ gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppText variant="title">{e.emoji}</AppText>
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {e.label}
                {e.moodLabel ? <AppText variant="caption" tone="text2">{`  ·  ${e.moodLabel}`}</AppText> : null}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel={`Modifier la note du ${e.label}`} hitSlop={8} onPress={() => router.push({ pathname: '/mood', params: { date: e.date, step: '2' } })}>
                <AppText variant="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                  Modifier
                </AppText>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Supprimer la note du ${e.label}`} hitSlop={8} onPress={() => void remove(e.date)}>
                <AppText variant="bodyStrong" tone="danger">
                  ✕
                </AppText>
              </Pressable>
            </View>
            {e.feelings.length > 0 ? (
              <AppText variant="caption" tone="text2">
                {e.feelings.join(' · ')}
              </AppText>
            ) : null}
            <AppText>{e.text}</AppText>
          </View>
        ))
      )}
      {m.remaining > 0 ? <Button label={`Voir plus (${m.remaining})`} variant="outline" onPress={() => setLimit((l) => l + JOURNAL_MORE)} /> : null}
    </View>
  );
}
