import { TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export function TextField({
  label,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  placeholder,
  multiline = false,
  flex = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  readonly maxLength?: number;
  readonly placeholder?: string;
  readonly multiline?: boolean;
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
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          minHeight: multiline ? 120 : 48,
          borderWidth: 2,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          fontFamily: 'Instrument-Medium',
          fontSize: 16,
          color: colors.text,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        }}
      />
    </View>
  );
}
