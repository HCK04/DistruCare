export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type HardwareEvent =
  | { evt: 'dispensed';  type: 'AM' | 'PM' | 'TEST' }
  | { evt: 'confirmed';  type: 'AM' | 'PM' | 'TS' }
  | { evt: 'error';      msg: string };

type EventHandler  = (event: HardwareEvent) => void;
type StatusHandler = (status: ConnectionStatus) => void;

const POLL_MS      = 3_000;
const TIMEOUT_MS   = 6_000;

function withTimeout(ms: number): AbortSignal {
  return AbortSignal.timeout ? AbortSignal.timeout(ms) : (() => {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  })();
}

class HttpService {
  private baseUrl: string | null  = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastEventId             = -1;
  private eventHandlers           = new Set<EventHandler>();
  private statusHandlers          = new Set<StatusHandler>();

  // ── URL management ───────────────────────────────────────

  setUrl(ip: string): void {
    // Accept bare IP or IP:port; normalise to http://...
    const clean = ip.trim().replace(/^https?:\/\//, '');
    this.baseUrl = `http://${clean}`;
  }

  get deviceIp(): string {
    return this.baseUrl ? this.baseUrl.replace('http://', '') : '';
  }

  // ── Connection lifecycle ─────────────────────────────────

  async connect(): Promise<void> {
    if (!this.baseUrl) throw new Error('No device IP set. Enter the IP shown on the LCD.');

    this.emitStatus('connecting');

    try {
      const resp = await fetch(`${this.baseUrl}/status`, { signal: withTimeout(TIMEOUT_MS) });
      if (!resp.ok) throw new Error('Device returned an error response.');
    } catch (e: any) {
      this.emitStatus('disconnected');
      if (e?.name === 'AbortError') {
        throw new Error('Device did not respond in time. Check IP and make sure the device is on the same WiFi.');
      }
      throw new Error('Could not reach the device. Check the IP address and your WiFi network.');
    }

    // Sync current local time to the RTC
    const now = new Date();
    await fetch(`${this.baseUrl}/settime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        h: now.getHours(), m: now.getMinutes(), s: now.getSeconds(),
        day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear(),
      }),
      signal: withTimeout(TIMEOUT_MS),
    }).catch(() => { /* non-fatal */ });

    this.emitStatus('connected');
    this.startPolling();
  }

  disconnect(): void {
    this.stopPolling();
    this.emitStatus('disconnected');
  }

  // ── Command sending ──────────────────────────────────────

  async post(endpoint: string, body: object = {}): Promise<void> {
    if (!this.baseUrl) throw new Error('Not connected');
    const resp = await fetch(`${this.baseUrl}/${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  withTimeout(TIMEOUT_MS),
    });
    if (!resp.ok) throw new Error(`Device rejected the command (HTTP ${resp.status})`);
  }

  // ── Polling ──────────────────────────────────────────────

  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      if (!this.baseUrl) return;
      try {
        const resp = await fetch(`${this.baseUrl}/status`, { signal: withTimeout(TIMEOUT_MS) });
        if (!resp.ok) throw new Error('bad status');
        const data = await resp.json();

        if (typeof data.event_id === 'number' && data.event_id !== this.lastEventId) {
          this.lastEventId = data.event_id;
          if (data.last_event && data.last_event !== null) {
            this.eventHandlers.forEach((h) => h(data.last_event as HardwareEvent));
          }
        }
      } catch {
        this.stopPolling();
        this.emitStatus('disconnected');
      }
    }, POLL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this.lastEventId = -1;
  }

  // ── Subscriptions ────────────────────────────────────────

  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private emitStatus(s: ConnectionStatus): void {
    this.statusHandlers.forEach((h) => h(s));
  }

  get isConnected(): boolean { return this.pollTimer !== null; }
}

export default new HttpService();
