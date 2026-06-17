import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDoseReminders(
  amTime: string,
  pmTime: string,
  amMedList: string[],
  pmMedList: string[]
): Promise<void> {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const amLabel = amMedList.join(', ') || 'médicament';
  const pmLabel = pmMedList.join(', ') || 'médicament';

  const [amHour, amMin] = amTime.split(':').map(Number);
  const [pmHour, pmMin] = pmTime.split(':').map(Number);

  if (Platform.OS !== 'web') {
    // On ne programme les rappels que pour les moments qui ont un médicament :
    // la prise du matin OU celle du soir peut être absente.
    if (amMedList.length) {
      // Rappel du matin
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Dose du matin',
          body: `C'est l'heure de prendre votre ${amLabel}.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: amHour,
          minute: amMin,
        },
      });

      // 30-min follow-up AM
      const amFollowup = amMin + 30 >= 60
        ? { hour: amHour + 1, minute: (amMin + 30) % 60 }
        : { hour: amHour, minute: amMin + 30 };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel',
          body: `Avez-vous pris votre ${amLabel} du matin ? Pensez à le confirmer dans Distrucare.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          ...amFollowup,
        },
      });
    }

    if (pmMedList.length) {
      // Rappel du soir
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Dose du soir',
          body: `N'oubliez pas votre ${pmLabel} ce soir.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: pmHour,
          minute: pmMin,
        },
      });

      // 30-min follow-up PM
      const pmFollowup = pmMin + 30 >= 60
        ? { hour: pmHour + 1, minute: (pmMin + 30) % 60 }
        : { hour: pmHour, minute: pmMin + 30 };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel',
          body: `Avez-vous pris votre ${pmLabel} du soir ? Pensez à le confirmer dans Distrucare.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          ...pmFollowup,
        },
      });
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
