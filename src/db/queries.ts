import { getDatabase } from './database';

export interface Schedule {
  id: number;
  medication_name: string;       // combined label (for the device LCD / legacy)
  am_medication_name: string;
  pm_medication_name: string;
  am_time: string;
  pm_time: string;
  notifications_enabled: number;
  is_setup: number;
  device_ip: string;
  large_text: number;
}

// Per-dose medicine lists are stored as a JSON array string in
// am_medication_name / pm_medication_name. These helpers serialise to / from a
// plain string[]. parse is tolerant of the legacy single-name (non-JSON) value.
export function parseMedList(raw: string): string[] {
  const s = (raw ?? '').trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
      }
    } catch { /* fall through to single-name */ }
  }
  return [s];
}

export function serializeMedList(list: string[]): string {
  return JSON.stringify(list.map((x) => x.trim()).filter(Boolean));
}

// Single combined label across both dose lists (for the device LCD and any
// place that shows one name). De-duplicates and joins with " / ".
export function combinedMedLabel(amList: string[], pmList: string[]): string {
  const all = [...amList, ...pmList].map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(all)).join(' / ');
}

export interface DoseLog {
  id: number;
  date: string;
  dose_type: 'AM' | 'PM';
  status: 'taken' | 'missed' | 'late' | 'pending';
  logged_at: string;
}

// ── Schedule ──────────────────────────────────────────────
export async function getIsSetupComplete(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ is_setup: number }>('SELECT is_setup FROM schedule LIMIT 1');
  return row?.is_setup === 1;
}

export async function markSetupComplete(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE schedule SET is_setup = 1 WHERE id = 1');
}

export async function getSchedule(): Promise<Schedule> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Schedule>('SELECT * FROM schedule LIMIT 1');
  return row!;
}

export async function updateSchedule(
  amMedList: string[],
  pmMedList: string[],
  amTime: string,
  pmTime: string,
  notificationsEnabled: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE schedule
     SET medication_name = ?, am_medication_name = ?, pm_medication_name = ?,
         am_time = ?, pm_time = ?, notifications_enabled = ?
     WHERE id = 1`,
    [
      combinedMedLabel(amMedList, pmMedList),
      serializeMedList(amMedList),
      serializeMedList(pmMedList),
      amTime,
      pmTime,
      notificationsEnabled ? 1 : 0,
    ]
  );
}

// ── Dose Logs ─────────────────────────────────────────────
export async function getTodayLogs(): Promise<DoseLog[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  return db.getAllAsync<DoseLog>(
    `SELECT * FROM dose_logs WHERE date = ? ORDER BY dose_type ASC`,
    [today]
  );
}

export async function getLogsForDate(date: string): Promise<DoseLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<DoseLog>(
    `SELECT * FROM dose_logs WHERE date = ? ORDER BY dose_type ASC`,
    [date]
  );
}

export async function getLogsForDateRange(
  startDate: string,
  endDate: string
): Promise<DoseLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<DoseLog>(
    `SELECT * FROM dose_logs
     WHERE date >= ? AND date <= ?
     ORDER BY date DESC, dose_type ASC`,
    [startDate, endDate]
  );
}

export async function upsertDoseLog(
  date: string,
  doseType: 'AM' | 'PM',
  status: 'taken' | 'missed' | 'late'
): Promise<void> {
  const db = await getDatabase();
  const loggedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO dose_logs (date, dose_type, status, logged_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date, dose_type) DO UPDATE SET status = excluded.status, logged_at = excluded.logged_at`,
    [date, doseType, status, loggedAt]
  );
}

export async function getDeviceIp(): Promise<string> {
  const db  = await getDatabase();
  const row = await db.getFirstAsync<{ device_ip: string }>('SELECT device_ip FROM schedule LIMIT 1');
  return row?.device_ip ?? '';
}

export async function setDeviceIp(ip: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE schedule SET device_ip = ? WHERE id = 1', [ip]);
}

// ── Accessibilité : préférence « gros caractères » ────────
export async function getLargeText(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ large_text: number }>('SELECT large_text FROM schedule LIMIT 1');
  return row?.large_text === 1;
}

export async function setLargeText(enabled: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE schedule SET large_text = ? WHERE id = 1', [enabled ? 1 : 0]);
}

export async function clearTodayLogs(): Promise<void> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  await db.runAsync(`DELETE FROM dose_logs WHERE date = ?`, [today]);
}

export async function getAdherenceStats(days: number = 30): Promise<{
  total: number;
  taken: number;
  missed: number;
  late: number;
  percentage: number;
}> {
  const db = await getDatabase();
  const end = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split('T')[0];

  const rows = await db.getAllAsync<{ status: string; count: number }>(
    `SELECT status, COUNT(*) as count FROM dose_logs
     WHERE date >= ? AND date <= ? AND status != 'pending'
     GROUP BY status`,
    [start, end]
  );

  let taken = 0, missed = 0, late = 0;
  rows.forEach((r) => {
    if (r.status === 'taken') taken = r.count;
    else if (r.status === 'missed') missed = r.count;
    else if (r.status === 'late') late = r.count;
  });

  const total = taken + missed + late;
  const percentage = total > 0 ? Math.round(((taken + late) / total) * 100) : 0;
  return { total, taken, missed, late, percentage };
}
