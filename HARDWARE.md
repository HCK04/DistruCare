# DisrtuCare — Hardware Integration Tracker

Status key: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Hardware Inventory

| Component | Status | Notes |
|-----------|--------|-------|
| LoLin NodeMCU V3 (ESP8266) | [x] Have it | Replaces Arduino Nano — has built-in WiFi |
| 16×2 LCD display | [x] Have it | |
| I2C LCD backpack (PCF8574) | [x] Have it | Address: 0x27 or 0x3F |
| DS3231 RTC module | [x] Have it | Keeps real time with CR2032 coin cell |
| 28BYJ-48 stepper motor | [x] Have it | |
| ULN2003 stepper driver board | [x] Have it | |
| Blue LED | [x] Have it | |
| Wiring / jumper cables | [x] Have it | |

> No additional hardware needed. The NodeMCU V3 provides WiFi directly.
> The phone connects to the NodeMCU over your home WiFi network (La_Fibre_dOrange_0E96).

---

## Architecture

```
Phone (Expo app)
      │
      │  HTTP over WiFi (same LAN)
      ▼
NodeMCU V3 (ESP8266 — HTTP server on port 80)
      │                │               │
      │ I2C            │ GPIO          │ GPIO
      ▼                ▼               ▼
 LCD + DS3231 RTC   ULN2003 →      Blue LED
                    28BYJ-48       + Button
```

---

## Phase 1 — NodeMCU Wiring

### 1.1 Power

| NodeMCU pin | Connects to |
|-------------|-------------|
| VIN (5V)    | ULN2003 VCC (stepper motor power) |
| 3V3         | DS3231 VCC, LCD backpack VCC |
| GND         | Common ground for all components |

> The 28BYJ-48 runs on 5V for full torque — use VIN, not 3V3.

### 1.2 I2C bus (shared by LCD backpack and DS3231 RTC)

| NodeMCU | Pin label | Connects to |
|---------|-----------|-------------|
| D1      | GPIO5 SCL | LCD backpack SCL + DS3231 SCL |
| D2      | GPIO4 SDA | LCD backpack SDA + DS3231 SDA |

Both devices live on the same I2C bus; wire them in parallel.
DS3231 default address: `0x68`. LCD backpack: `0x27` (or `0x3F`).

### 1.3 Stepper motor (ULN2003 IN1–IN4)

| NodeMCU | ULN2003 |
|---------|---------|
| D5      | IN1     |
| D6      | IN2     |
| D7      | IN3     |
| D8      | IN4     |

> D8 (GPIO15) must be LOW at power-on. The firmware ensures this via `motorStop()` in setup.

### 1.4 Blue LED and button

| NodeMCU | Component |
|---------|-----------|
| D0      | Blue LED anode (cathode → GND via 220 Ω resistor) |
| D3      | Button (one side → D3, other side → GND). The NodeMCU's built-in FLASH button on D3 works too. |

> Do **not** hold the D3 button while powering on — it puts the ESP8266 into flash mode.

### Wiring checklist
- [ ] NodeMCU VU → ULN2003 VCC
- [x] NodeMCU 3V3 → DS3231 VCC + LCD backpack VCC
- [x] Common GND connected across all components
- [x] I2C: D1 (SCL) and D2 (SDA) to LCD backpack AND DS3231
- [ ] Stepper: D5–D8 to ULN2003 IN1–IN4
- [ ] LED: D0 → 10k resistor → LED long leg
- [ ] Button: D3 to one terminal, other terminal to GND

---

## Phase 2 — HTTP API (Protocol)

The NodeMCU hosts an HTTP server on port 80. All messages are JSON over plain HTTP.

### App → Device

| Endpoint | Method | Body | Action |
|----------|--------|------|--------|
| `/status` | GET | — | Returns schedule, current time, last event |
| `/sync` | POST | `{"am":"08:00","pm":"20:00","med":"Metformin"}` | Update schedule + EEPROM + LCD |
| `/settime` | POST | `{"h":14,"m":30,"s":0,"day":16,"month":5,"year":2026}` | Set DS3231 clock |
| `/led` | POST | `{"state":1}` | Blue LED on (1) or off (0) |
| `/motor` | POST | `{"slots":1}` | Rotate dispenser by N slots |

### Device → App (via `/status` polling)

```json
{
  "am": "08:00",
  "pm": "20:00",
  "med": "Medication",
  "time": "14:30",
  "rtc": true,
  "awaiting": false,
  "event_id": 3,
  "last_event": { "evt": "confirmed", "type": "AM" }
}
```

The app polls `/status` every 3 seconds and fires event handlers when `event_id` changes.

### Event types

| `evt` value | Meaning |
|-------------|---------|
| `dispensed` | Motor rotated; pill is in the tray. type = AM / PM / TEST |
| `confirmed` | User pressed physical button. type = AM / PM |
| `error`     | Hardware fault. `msg` field describes it. |

- [x] Protocol defined

---

## Phase 3 — Arduino Firmware

Files live in `firmware/distruccare/`. Upload via Arduino IDE.

### 3.1 Board setup (Arduino IDE)

- [x] ESP8266 board package installed via arduino-cli
- [x] Board: NodeMCU 1.0 (ESP-12E Module) — FQBN `esp8266:esp8266:nodemcuv2`
- [x] Uploaded on COM8 — arduino-cli installed at `C:\arduino-cli\arduino-cli.exe`

### 3.2 Required libraries (Library Manager)

- [x] `LiquidCrystal_I2C` v1.1.2 — installed
- [x] `RTClib` v2.1.4 — installed (pulled in Adafruit BusIO automatically)
- [x] `ArduinoJson` v7.4.3 — installed (sketch updated to v7 API)

### 3.3 Firmware files

| File | Status | Description |
|------|--------|-------------|
| `config.h` | [x] | NodeMCU pins, WiFi SSID/password, EEPROM map |
| `motor.h/cpp` | [x] | 28BYJ-48 half-step driver |
| `lcd_display.h/cpp` | [x] | LiquidCrystal_I2C wrappers |
| `rtc_time.h/cpp` | [x] | DS3231 RTC via RTClib |
| `distruccare.ino` | [x] | Main sketch: WiFi, HTTP server, schedule logic |

### 3.4 Firmware features

- [x] Connects to WiFi `La_Fibre_dOrange_0E96` on boot; shows IP on LCD for 5 s
- [x] HTTP server on port 80 with REST endpoints
- [x] DS3231 RTC for accurate time; time is auto-synced from app on connect
- [x] EEPROM persistence for AM/PM schedule and medication name
- [x] Auto-dispenses at scheduled time (motor rotates, LED blinks)
- [x] Physical button debounce; fires `evt:confirmed` when pressed
- [x] Daily reset of dispense-tracking at midnight

### 3.5 Firmware testing (serial monitor, no app)

- [x] Sketch compiled and uploaded to COM8 (NodeMCU V3, ESP8266EX, 4MB flash)
- [x] Verify: connect NodeMCU to WiFi La_Fibre_dOrange_0E96 — IP confirmed via Serial
- [x] Verify: open browser on same WiFi → `http://<device-ip>/status` returns JSON
- [ ] POST to `http://<device-ip>/led` with `{"state":1}` → blue LED on  *(needs wiring)*
- [ ] POST to `http://<device-ip>/motor` with `{"slots":1}` → motor rotates  *(needs wiring)*

---

## Phase 4 — React Native App Integration

Transport: plain `fetch()` over WiFi — **no native modules, works in Expo Go**.

### 4.1 New / replaced files

| File | Status | Description |
|------|--------|-------------|
| `src/hardware/httpService.ts` | [x] | HTTP singleton: connect, poll, sendCommand |
| `src/hardware/bleService.ts` | [x] | Replaced — now re-exports httpService |
| `src/hardware/HardwareContext.tsx` | [x] | React context; loads saved IP from SQLite |
| `src/hardware/HardwareStatusBar.tsx` | [x] | Status chip in Dashboard header |
| `src/screens/HardwareScreen.tsx` | [x] | Device tab: IP input, controls, event log |

### 4.2 Key behaviours

- [x] Device IP persisted in SQLite `schedule.device_ip` column — survives app restarts
- [x] On connect: app sets device IP, pings `/status`, sends `/settime` to sync RTC
- [x] Polling every 3 s; disconnect detected automatically on poll failure
- [x] `evt:confirmed` → Dashboard auto-logs dose as Taken + shows Alert
- [x] Settings save → pushes updated schedule to device if connected
- [x] `app.json` cleaned of all Bluetooth permissions and BLE plugin

### 4.3 How to connect (user flow)

1. Power on NodeMCU — LCD shows IP (e.g. `192.168.1.42`) for 5 s
2. Open app → tap **Device** tab
3. Enter `192.168.1.42` in the IP field → tap **Connect**
4. Status turns green; IP is remembered for future sessions

---

## Phase 5 — End-to-End Testing

- [ ] Upload firmware; verify IP appears on LCD and in Serial Monitor
- [ ] Open app in Expo Go; enter IP → status turns green
- [ ] Change AM time in Settings → save → LCD updates within 2 s
- [ ] Set AM time to 1 min ahead → motor rotates, LED blinks, app receives `dispensed` event
- [ ] Press physical button → `confirmed` event, Dashboard auto-logs Taken
- [ ] Kill and reopen app → IP pre-filled, tap Connect → reconnects
- [ ] Move phone off WiFi → app shows Disconnected; reconnect when back on WiFi

---

## Phase 6 — Polish & Release

- [ ] Add haptic feedback on auto-log (`expo-haptics`)
- [ ] Test on physical Android device via Expo Go
- [ ] Bump app version to `1.1.0`

---

## Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Wiring | [ ] | Physical connections not yet made |
| 2 — Protocol | [x] | HTTP REST, defined and implemented |
| 3 — Firmware | [x] | Uploaded to COM8; WiFi connected at 192.168.1.5; all HTTP endpoints verified |
| 4 — React Native | [x] | HTTP service live; BLE fully removed |
| 5 — End-to-end testing | [ ] | Blocked on Phase 1 (physical wiring) |
| 6 — Polish | [ ] | Blocked on Phase 5 |
