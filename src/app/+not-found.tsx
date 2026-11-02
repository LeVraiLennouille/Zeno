import { Link } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';

export default function NotFound() {
  return (
    <Screen>
      <AppText variant="title">Page introuvable</AppText>
      <Link href="/">
        <AppText variant="bodyStrong">Retour à l’accueil</AppText>
      </Link>
    </Screen>
  );
}
