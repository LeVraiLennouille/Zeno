import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ALL_DAYS,
  BAD_PRESETS,
  DOW_LETTER,
  DOW_ORDER,
  HABIT_COLORS,
  HABIT_EMOJIS,
  KIND_DEFAULTS,
  KIND_INFO,
  WEEKDAYS,
  type HabitForm,
  type HabitFormKind,
} from '@/domain';
import { useEscapeToClose } from '@/hooks/useEscapeToClose';
import { HABIT_FORM_ERRORS } from '@/i18n/messages';
import { Icon } from '@/icons/Icon';
import { confirmAsync } from '@/services/confirm';
import { notify, notifyUndo } from '@/services/toast';
import { useStore } from '@/state/react/StoreProvider';
import { layout, useTheme } from '@/theme';

import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Toggle } from '../ui/Toggle';

function Section({ title, hint, children }: { readonly title: string; readonly hint?: string; readonly children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label" tone="text3">
        {title}
      </AppText>
      {children}
      {hint ? (
        <AppText variant="caption" tone="text2">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  placeholder,
  flex,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (t: string) => void;
  readonly keyboardType?: 'default' | 'decimal-pad';
  readonly maxLength?: number;
  readonly placeholder?: string;
  readonly flex?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 4 }, flex ? { flex: 1 } : null]}>
      <AppText variant="caption" tone="text2">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        style={[styles.input, { color: colors.text, borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
      />
    </View>
  );
}

export function HabitFormView({ initial }: { readonly initial: HabitForm }) {
  const store = useStore();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<HabitForm>(initial);
  useEscapeToClose(() => router.back());
  const patch = (p: Partial<HabitForm>): void => setForm((f) => ({ ...f, ...p }));

  const creating = form.mode === 'create';
  const numeric = form.kind === 'counter' || form.kind === 'water' || form.kind === 'drink';
  const hasDays = form.kind !== 'weekly' && form.kind !== 'times';

  const chooseKind = (kind: HabitFormKind): void => {
    const d = kind === 'counter' ? KIND_DEFAULTS.counter : kind === 'water' ? KIND_DEFAULTS.water : null;
    patch({
      kind,
      ...(d ? { goal: String(d.goal), step: String(d.step), max: String(d.max), unit: d.unit } : {}),
    });
  };

  const toggleDay = (d: number): void =>
    patch({ days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d], daysTouched: true });

  const save = (): void => {
    const r = store.saveHabit(form);
    if (!r.ok) {
      notify(HABIT_FORM_ERRORS[r.error], 'alert', 3200);
      return;
    }
    notify(r.value.created ? `« ${r.value.name} » ajoutée` : 'Habitude mise à jour', 'star', 2400);
    router.back();
  };

  const archive = (): void => {
    if (!form.id) return;
    const name = form.name;
    const undo = store.archiveHabit(form.id);
    router.back();
    if (undo) {
      const n = undo.reEnable.length;
      const extra = n ? ` · ${n} rappel${n > 1 ? 's' : ''} désactivé${n > 1 ? 's' : ''}` : '';
      notifyUndo(`« ${name} » archivée${extra}`, () => store.restoreHabit(undo.habitId, undo));
    }
  };

  const remove = async (): Promise<void> => {
    if (!form.id) return;
    const ok = await confirmAsync(
      'Supprimer définitivement ?',
      `« ${form.name} » et tout son historique seront effacés (tu pourras annuler quelques secondes).`,
      'Supprimer',
      true,
    );
    if (!ok) return;
    const name = form.name;
    const undo = store.purgeHabit(form.id);
    router.back();
    if (undo) {
      notifyUndo(`« ${name} » supprimée`, () => {
        store.undoPurge(undo);
        notify('Habitude rétablie', 'star', 2400);
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: colors.border }]}>
        <AppText variant="title">{creating ? 'Nouvelle habitude' : "Modifier l'habitude"}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10} onPress={() => router.back()}>
          <Icon name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {creating ? (
          <Section title="Type">
            <View style={styles.wrap}>
              {KIND_INFO.map((k) => (
                <Chip key={k.k} label={k.label} selected={form.kind === k.k} onPress={() => chooseKind(k.k)} />
              ))}
            </View>
            <AppText variant="caption" tone="text2">
              {KIND_INFO.find((k) => k.k === form.kind)?.hint ?? ''}
            </AppText>
          </Section>
        ) : null}

        {form.kind === 'bad' && creating ? (
          <Section title="Idées">
            <View style={styles.wrap}>
              {BAD_PRESETS.map((p) => (
                <Chip
                  key={p.name}
                  label={`${p.emoji} ${p.name}`}
                  selected={false}
                  onPress={() =>
                    patch({ name: p.name, emoji: p.emoji, levels: p.levels, badMode: p.levels ? 'levels' : 'simple' })
                  }
                />
              ))}
            </View>
          </Section>
        ) : null}

        <Field label="Nom" value={form.name} onChangeText={(name) => patch({ name })} maxLength={30} placeholder="Ex. Méditation" />

        {!form.builtin ? (
          <Section title="Emoji">
            <View style={styles.wrap}>
              {HABIT_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${e}`}
                  accessibilityState={{ selected: form.emoji === e }}
                  onPress={() => patch({ emoji: e })}
                  style={[styles.emoji, { borderColor: form.emoji === e ? colors.text : colors.border }]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Couleur">
          <View style={styles.wrap}>
            {HABIT_COLORS.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`Couleur ${c}`}
                accessibilityState={{ selected: form.color === c }}
                onPress={() => patch({ color: c })}
                style={[styles.swatch, { backgroundColor: c, borderColor: form.color === c ? colors.text : 'transparent' }]}
              />
            ))}
          </View>
        </Section>

        {hasDays ? (
          <Section title="Jours" hint={form.days.length === 0 ? 'Choisis au moins un jour' : undefined}>
            <View style={styles.wrap}>
              {DOW_ORDER.map((d) => (
                <Chip key={d} label={DOW_LETTER[d] ?? ''} selected={form.days.includes(d)} onPress={() => toggleDay(d)} />
              ))}
            </View>
            <View style={styles.wrap}>
              <Chip label="Tous les jours" selected={false} onPress={() => patch({ days: ALL_DAYS, daysTouched: true })} />
              <Chip label="Lun - Ven" selected={false} onPress={() => patch({ days: WEEKDAYS, daysTouched: true })} />
              <Chip label="Week-end" selected={false} onPress={() => patch({ days: [6, 0], daysTouched: true })} />
            </View>
          </Section>
        ) : null}

        {form.kind === 'times' ? (
          <Section title="Fois par semaine" hint="Quels que soient les jours">
            <View style={styles.row}>
              <Chip label="−" selected={false} onPress={() => patch({ target: Math.max(1, form.target - 1) })} />
              <AppText variant="title">{form.target}</AppText>
              <Chip label="+" selected={false} onPress={() => patch({ target: Math.min(6, form.target + 1) })} />
            </View>
          </Section>
        ) : null}

        {numeric ? (
          <Section title="Objectif">
            <View style={styles.row}>
              <Field flex label="Objectif" value={form.goal} onChangeText={(goal) => patch({ goal })} keyboardType="decimal-pad" />
              <Field flex label="Ajout par tap" value={form.step} onChangeText={(step) => patch({ step })} keyboardType="decimal-pad" />
            </View>
            <View style={styles.row}>
              <Field flex label="Maximum" value={form.max} onChangeText={(max) => patch({ max })} keyboardType="decimal-pad" />
              {form.kind === 'counter' ? (
                <Field flex label="Unité" value={form.unit} onChangeText={(unit) => patch({ unit })} maxLength={8} placeholder="km, pages…" />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
          </Section>
        ) : null}

        {form.kind === 'bad' ? (
          <Section title="Suivi" hint="Avec paliers : choisis combien de temps (ou combien) tu as craqué.">
            <View style={styles.wrap}>
              <Chip label="Simple" selected={form.badMode === 'simple'} onPress={() => patch({ badMode: 'simple' })} />
              <Chip label="Avec paliers" selected={form.badMode === 'levels'} onPress={() => patch({ badMode: 'levels' })} />
            </View>
            {form.badMode === 'levels' ? (
              <Field label="Paliers (séparés par des virgules)" value={form.levels} onChangeText={(levels) => patch({ levels })} placeholder="15 min, 30 min, 1 h" />
            ) : null}
          </Section>
        ) : null}

        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">Habitude facultative</AppText>
            <AppText variant="caption" tone="text2">
              Ne compte pas dans la journée parfaite
            </AppText>
          </View>
          <Toggle label="Habitude facultative" value={form.optional} onChange={(optional) => patch({ optional })} />
        </View>

        <Button label={creating ? 'Créer' : 'Enregistrer'} onPress={save} />
        {!creating ? (
          <View style={{ gap: 10 }}>
            <Button label="Archiver" variant="outline" onPress={archive} />
            <Button label="Supprimer définitivement" variant="danger" onPress={() => void remove()} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1.5 },
  body: { padding: 20, gap: 20, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { minHeight: 48, borderWidth: 2, borderRadius: 14, paddingHorizontal: 14, fontFamily: 'Instrument-Medium', fontSize: 16 },
  emoji: { width: 46, height: 46, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
});
