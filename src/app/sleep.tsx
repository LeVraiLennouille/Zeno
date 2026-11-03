import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ModalScreen } from '@/components/ui/ModalScreen';
import { TextField } from '@/components/ui/TextField';
import { today } from '@/domain';
import { SLEEP_ERRORS } from '@/i18n/messages';
import { notify } from '@/services/toast';
import { useCtx, useStore } from '@/state/react/StoreProvider';

export default function SleepScreen() {
  const router = useRouter();
  const store = useStore();
  const ctx = useCtx();
  const current = ctx.db.sleepLog[today(ctx)];
  const [hours, setHours] = useState(current ? String(current.hours) : '');
  const [minutes, setMinutes] = useState(current ? String(current.minutes).padStart(2, '0') : '');
  const [bedtime, setBedtime] = useState(current?.bedtime ?? '');
  const [wakeTime, setWakeTime] = useState(current?.wakeTime ?? '');

  const save = (): void => {
    const r = store.saveSleep({ hours, minutes, bedtime, wakeTime });
    if (!r.ok) {
      notify(SLEEP_ERRORS[r.error], 'alert', 3200);
      return;
    }
    router.back();
    notify(`Sommeil enregistré : ${r.value.hours} h ${r.value.minutes} min`, 'moon', 3200);
  };

  return (
    <ModalScreen title="Ta nuit">
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextField flex label="Heures" value={hours} onChangeText={setHours} keyboardType="number-pad" maxLength={2} placeholder="7" />
        <TextField flex label="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} placeholder="30" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextField flex label="Coucher (HH:MM)" value={bedtime} onChangeText={setBedtime} maxLength={5} placeholder="23:00" />
        <TextField flex label="Réveil (HH:MM)" value={wakeTime} onChangeText={setWakeTime} maxLength={5} placeholder="06:30" />
      </View>
      <Button label="Enregistrer" onPress={save} />
    </ModalScreen>
  );
}
