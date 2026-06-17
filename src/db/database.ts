import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('distruccare.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY NOT NULL,
      medication_name TEXT NOT NULL DEFAULT 'My Medication',
      am_medication_name TEXT NOT NULL DEFAULT '',
      pm_medication_name TEXT NOT NULL DEFAULT '',
      am_time TEXT NOT NULL DEFAULT '08:00',
      pm_time TEXT NOT NULL DEFAULT '20:00',
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      is_setup INTEGER NOT NULL DEFAULT 0,
      device_ip TEXT NOT NULL DEFAULT '',
      large_text INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      dose_type TEXT NOT NULL CHECK(dose_type IN ('AM', 'PM')),
      status TEXT NOT NULL CHECK(status IN ('taken', 'missed', 'late', 'pending')),
      logged_at TEXT NOT NULL,
      UNIQUE(date, dose_type)
    );
  `);

  // Insert default schedule row if none exists
  const existing = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM schedule LIMIT 1'
  );
  if (!existing) {
    await database.runAsync(
      `INSERT INTO schedule (medication_name, am_time, pm_time, notifications_enabled, is_setup)
       VALUES (?, ?, ?, ?, ?)`,
      ['My Medication', '08:00', '20:00', 1, 0]
    );
  } else {
    // Migrate: add columns that may be missing in older installs
    try { await database.execAsync('ALTER TABLE schedule ADD COLUMN is_setup INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
    try { await database.execAsync("ALTER TABLE schedule ADD COLUMN device_ip TEXT NOT NULL DEFAULT ''"); } catch (_) {}
    try { await database.execAsync('ALTER TABLE schedule ADD COLUMN large_text INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
    try { await database.execAsync("ALTER TABLE schedule ADD COLUMN am_medication_name TEXT NOT NULL DEFAULT ''"); } catch (_) {}
    try { await database.execAsync("ALTER TABLE schedule ADD COLUMN pm_medication_name TEXT NOT NULL DEFAULT ''"); } catch (_) {}
  }

  // Backfill the per-dose names from the single legacy name where still blank,
  // so upgraded installs show the existing medication for both doses.
  await database.runAsync(
    `UPDATE schedule SET am_medication_name = medication_name WHERE am_medication_name = ''`
  );
  await database.runAsync(
    `UPDATE schedule SET pm_medication_name = medication_name WHERE pm_medication_name = ''`
  );
}
