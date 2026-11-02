import { Alert, Platform } from 'react-native';

/** Confirmation native (Alert) ou navigateur (`window.confirm`) : `Alert.alert` ne fait rien sur le web. */
export function confirmAsync(title: string, message: string, confirmLabel = 'Confirmer', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    const w = globalThis as unknown as { confirm?: (text: string) => boolean };
    return Promise.resolve(w.confirm ? w.confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
