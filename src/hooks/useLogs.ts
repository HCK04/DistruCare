import { useState, useEffect, useCallback } from 'react';
import {
  getTodayLogs,
  upsertDoseLog,
  getLogsForDateRange,
  getAdherenceStats,
  clearTodayLogs,
  DoseLog,
} from '../db/queries';

export function useTodayLogs() {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const l = await getTodayLogs();
    setLogs(l);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logDose = useCallback(
    async (doseType: 'AM' | 'PM', status: 'taken' | 'missed' | 'late') => {
      const today = new Date().toISOString().split('T')[0];
      await upsertDoseLog(today, doseType, status);
      await load();
    },
    [load]
  );

  const resetToday = useCallback(async () => {
    await clearTodayLogs();
    await load();
  }, [load]);

  const getLogForType = useCallback(
    (type: 'AM' | 'PM') => logs.find((l) => l.dose_type === type) ?? null,
    [logs]
  );

  return { logs, loading, reload: load, logDose, resetToday, getLogForType };
}

export function useHistoryLogs(startDate: string, endDate: string) {
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [stats, setStats] = useState({ total: 0, taken: 0, missed: 0, late: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [l, s] = await Promise.all([
      getLogsForDateRange(startDate, endDate),
      getAdherenceStats(30),
    ]);
    setLogs(l);
    setStats(s);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, stats, loading, reload: load };
}
