import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { fmtDate, importSummaryText, lastBackupLabel, parseBackup, restorePointLabel } from '@/domain';
import { confirmAsync } from '@/services/confirm';
import { exportBackupFile, pickBackupText } from '@/services/backupFiles';
import { notify, notifyUndo } from '@/services/toast';
import { useModel, useStore } from '@/state/react/StoreProvider';
import { useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

/** Exporter, importer et annuler un import : vos données restent à vous. */
export function BackupSection() {
  const store = useStore();
  const { colors } = useTheme();
  const label = useModel(lastBackupLabel);
  const [restoreAt, setRestoreAt] = useState<string | null | undefined>(undefined);

  const refreshRestorePoint = useCallback(async (): Promise<void> => {
    const info = await store.restorePointInfo();
    setRestoreAt(info === null ? undefined : info.at);
  }, [store]);
  useEffect(() => {
    void refreshRestorePoint();
  }, [refreshRestorePoint]);

  const exportData = async (): Promise<void> => {
    const text = store.exportBackup();
    const outcome = await exportBackupFile(text, `zeno-${fmtDate(store.clock.now())}.json`);
    if (outcome === 'failed') notify('Export impossible sur cet appareil', 'alert', 3600);
    else notify(outcome === 'downloaded' ? 'Sauvegarde téléchargée' : 'Sauvegarde prête à être enregistrée', 'star', 2800);
  };

  const importData = async (): Promise<void> => {
    const picked = await pickBackupText();
    if (!picked.ok) {
      if (picked.reason === 'too_big') notify('Fichier trop volumineux (15 Mo maximum)', 'alert', 3800);
      else if (picked.reason === 'unreadable') notify('Impossible de lire le fichier', 'alert', 3800);
      return;
    }
    const parsed = parseBackup(picked.text, fmtDate(store.clock.now()));
    if (!parsed.ok) {
      notify(parsed.error, 'alert', 4000);
      return;
    }
    const sure = await confirmAsync(
      'Remplacer tes données actuelles ?',
      `${importSummaryText(parsed.db, parsed.meta.exportedAt)}\n\nTes données actuelles sont conservées : tu pourras annuler l’import.`,
      'Importer',
      true,
    );
    if (!sure) return;
    const result = await store.importBackup(picked.text);
    if (!result.ok) {
      notify(result.error, 'alert', 4000);
      return;
    }
    void refreshRestorePoint();
    notifyUndo('Sauvegarde importée', () => {
      void store.restorePreviousImport().then(() => {
        notify('Import annulé', 'star', 2600);
        void refreshRestorePoint();
      });
    }, 12000);
  };

  const undoImport = async (): Promise<void> => {
    if (!(await confirmAsync('Annuler le dernier import ?', 'Tes données d’avant l’import seront rétablies.', 'Annuler l’import'))) return;
    if (await store.restorePreviousImport()) notify('Données rétablies', 'star', 2600);
    else notify('Aucun point de restauration', 'alert', 2800);
    void refreshRestorePoint();
  };

  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <AppText variant="label" tone="text3">
        Sauvegarde
      </AppText>
      <Card shadow={false} style={{ gap: 12, borderColor: colors.border }}>
        <AppText variant="caption" tone="text2">
          {label}
        </AppText>
        <AppText variant="caption" tone="text2">
          Un fichier JSON contient tout : habitudes, historique, humeurs, notes. Il est compatible avec la version web d’origine.
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button label="Exporter mes données" onPress={() => void exportData()} />
          <Button label="Importer une sauvegarde" variant="outline" onPress={() => void importData()} />
        </View>
        {restoreAt !== undefined ? (
          <Button
            label={`Annuler le dernier import${restoreAt ? ` (données du ${restorePointLabel(restoreAt)})` : ''}`}
            variant="outline"
            onPress={() => void undoImport()}
          />
        ) : null}
      </Card>
    </View>
  );
}
