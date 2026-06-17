import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
import httpService, { ConnectionStatus, HardwareEvent } from './httpService';
import { getDeviceIp, setDeviceIp } from '../db/queries';

interface ScheduleLike {
  am_time: string;
  pm_time: string;
  medication_name: string;
}

interface HardwareCtx {
  status:       ConnectionStatus;
  lastEvent:    HardwareEvent | null;
  savedIp:      string;
  connect:      (ip?: string) => Promise<void>;
  disconnect:   () => void;
  syncSchedule: (schedule: ScheduleLike) => Promise<void>;
  testLed:      (on: boolean) => Promise<void>;
  testMotor:    (slots?: number) => Promise<void>;
  requestStatus:() => Promise<void>;
}

const HardwareContext = createContext<HardwareCtx | null>(null);

export function HardwareProvider({ children }: { children: React.ReactNode }) {
  const [status,    setStatus]    = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<HardwareEvent | null>(null);
  const [savedIp,   setSavedIp]   = useState('');

  useEffect(() => {
    // Load persisted IP and register service listeners
    getDeviceIp().then((ip) => {
      if (ip) { httpService.setUrl(ip); setSavedIp(ip); }
    }).catch(() => {});

    const offStatus = httpService.onStatus(setStatus);
    const offEvent  = httpService.onEvent(setLastEvent);
    return () => { offStatus(); offEvent(); };
  }, []);

  const connect = useCallback(async (ip?: string) => {
    if (ip) {
      const clean = ip.trim();
      httpService.setUrl(clean);
      setSavedIp(clean);
      setDeviceIp(clean).catch(() => {});
    }
    await httpService.connect();
  }, []);

  const disconnect = useCallback(() => {
    httpService.disconnect();
  }, []);

  const syncSchedule = useCallback(async (s: ScheduleLike) => {
    await httpService.post('sync', { am: s.am_time, pm: s.pm_time, med: s.medication_name });
  }, []);

  const testLed = useCallback(async (on: boolean) => {
    await httpService.post('led', { state: on ? 1 : 0 });
  }, []);

  const testMotor = useCallback(async (slots = 1) => {
    await httpService.post('motor', { slots });
  }, []);

  const requestStatus = useCallback(async () => {
    // Status is fetched automatically by the poll loop; this triggers an immediate fetch
    await httpService.post('status', {}).catch(() => {});
  }, []);

  return (
    <HardwareContext.Provider
      value={{ status, lastEvent, savedIp, connect, disconnect, syncSchedule, testLed, testMotor, requestStatus }}
    >
      {children}
    </HardwareContext.Provider>
  );
}

export function useHardware(): HardwareCtx {
  const ctx = useContext(HardwareContext);
  if (!ctx) throw new Error('useHardware must be used inside <HardwareProvider>');
  return ctx;
}
