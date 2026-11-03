import { View } from 'react-native';

import { backupNudge, fmtDate } from '@/domain';
import { exportBackupFile } from '@/services/backupFiles';
import { notify } from '@/services/toast';
import { useModel, useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';

/** Rappel discret : sauvegarde absente ou ancienne (14 jours). */
export function BackupNudgeView() {
  const nudge = useModel(backupNudge);
  const store = useStore();
  const { colors } = useTheme();
  if (!nudge.show) return null;

  const save = async (): Promise<void> => {
    const outcome = await exportBackupFile(store.exportBackup(), `zeno-${fmtDate(store.clock.now())}.json`);
    if (outcome === 'failed') notify('Export impossible sur cet appareil', 'alert', 3600);
  };

  return (
    <View style={{ gap: 10, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surface }}>
      <AppText variant="bodyStrong">{nudge.text}</AppText>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Sauvegarder" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => void save()} />
        <Button label="Plus tard" variant="outline" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => store.snoozeBackupNudge()} />
      </View>
    </View>
  );
}
