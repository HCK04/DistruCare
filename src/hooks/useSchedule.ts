import { useState, useEffect, useCallback } from 'react';
import { getSchedule, updateSchedule, Schedule } from '../db/queries';

export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getSchedule();
    setSchedule(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (
      amMedList: string[],
      pmMedList: string[],
      amTime: string,
      pmTime: string,
      notificationsEnabled: boolean
    ) => {
      await updateSchedule(amMedList, pmMedList, amTime, pmTime, notificationsEnabled);
      await load();
    },
    [load]
  );

  return { schedule, loading, reload: load, save };
}
