import { format, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatTime(date: Date): string {
  // Format 24 h (usage francophone).
  return format(date, 'HH:mm');
}

export function formatDate(date: Date): string {
  return format(date, 'd MMM yyyy', { locale: fr });
}

export function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Aujourd'hui";
  return format(date, 'EEE d MMM', { locale: fr });
}

export function getWeekDays(referenceDate: Date = new Date()): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDayCheck(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function dateToTimeString(date: Date): string {
  return format(date, 'HH:mm');
}

export function getCountdown(targetTime: string): string {
  const now = new Date();
  const target = timeStringToDate(targetTime);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  const diffMs = target.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, '0')}`;
}

export function getNextDoseInfo(
  amTime: string,
  pmTime: string,
  amActive: boolean = true,
  pmActive: boolean = true,
): { label: string; time: string; countdown: string } {
  const now = new Date();
  const amDate = timeStringToDate(amTime);
  const pmDate = timeStringToDate(pmTime);

  // Une seule prise peut être active (matin OU soir) : on ignore celle qui
  // n'a pas de médicament pour ne pas annoncer une dose inexistante.
  let nextLabel: string;
  let nextTime: string;

  if (amActive && now < amDate) {
    nextLabel = 'Dose du matin';
    nextTime = amTime;
  } else if (pmActive && now < pmDate) {
    nextLabel = 'Dose du soir';
    nextTime = pmTime;
  } else if (amActive) {
    nextLabel = 'Dose du matin (demain)';
    nextTime = amTime;
  } else {
    nextLabel = 'Dose du soir (demain)';
    nextTime = pmTime;
  }

  return {
    label: nextLabel,
    time: formatTime(timeStringToDate(nextTime)),
    countdown: getCountdown(nextTime),
  };
}
