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

export interface DiagResult {
  rtc_hw: boolean;
  rtc_running: boolean;
  lcd: boolean;
  i2c: string[];
  heap: number;
  rssi: number;
}

interface HardwareCtx {
  status:       ConnectionStatus;
  lastEvent:    HardwareEvent | null;
  savedIp:      string;
  connect:      (ip?: string) => Promise<void>;
  disconnect:   () => void;
  syncSchedule: (schedule: ScheduleLike) => Promise<void>;
  runDiag:      () => Promise<DiagResult>;
  runSelfTest:  () => Promise<void>;
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

  const runDiag = useCallback(async () => {
    return await httpService.get<DiagResult>('diag');
  }, []);

  const runSelfTest = useCallback(async () => {
    // The self-test spins the motor through its full coil-chase + rotation,
    // which blocks the device for ~7 s — give it a generous timeout.
    await httpService.get('selftest', 15_000);
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
      value={{ status, lastEvent, savedIp, connect, disconnect, syncSchedule, runDiag, runSelfTest, testMotor, requestStatus }}
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
