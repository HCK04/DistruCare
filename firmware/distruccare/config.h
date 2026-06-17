#pragma once

// ── WiFi ──────────────────────────────────────────────────
// This build connects to ONE network only: Aya's iPhone personal hotspot.
// Nothing else is tried. On the phone, enable "Maximize Compatibility"
// (2.4 GHz) so the ESP8266 can see the hotspot.
#define WIFI_SSID  "iPhone"
#define WIFI_PASS  "aya123456789."

// ── NodeMCU V3 (ESP8266) pin mapping ──────────────────────
// Using D-number labels that match the silkscreen on the board.
//
// Stepper motor  →  ULN2003 IN1–IN4
#define MOTOR_IN1  D5   // GPIO14
#define MOTOR_IN2  D6   // GPIO12
#define MOTOR_IN3  D7   // GPIO13
// IN4 moved OFF D8 (GPIO15, a boot strapping pin that held the chip in halt
// mode at power-on) onto D0 (GPIO16) — a safe, non-strapping pin that is free
// because no LED is wired. Resistor-free fix; connect ULN2003 IN4 to D0.
#define MOTOR_IN4  D0   // GPIO16  (was D8)

// I2C bus — shared by LCD backpack (PCF8574) and DS3231 RTC
#define I2C_SDA    D2   // GPIO4
#define I2C_SCL    D1   // GPIO5

// LCD I2C backpack — scan with I2C scanner if address is wrong (0x27 or 0x3F)
#define LCD_ADDRESS  0x27
#define LCD_COLS       16
#define LCD_ROWS        2

// Blue LED — not wired in this build. Parked on D8 (GPIO15), now free since the
// motor moved off it. Nothing is connected here; D8 floats low at boot (safe).
#define LED_PIN    D8   // GPIO15  (was D0; no physical LED)

// Confirm button — the NodeMCU built-in FLASH button on D3 works here too.
// Do NOT hold this LOW while powering on (it would enter flash mode).
#define BUTTON_PIN D3   // GPIO0, INPUT_PULLUP

// ── Motor constants (28BYJ-48, half-step drive) ────────────
// The 28BYJ-48's internal gearbox is NOT 64:1 — it is 63.68395:1. So one true
// OUTPUT revolution is 32 * 63.68395 = 2037.9 full steps -> 4075.77 HALF-steps,
// NOT the often-quoted 4096. Commanding the rounded 4096/2048 makes every slot
// over-rotate by ~10 half-steps; that fractional error compounds rotation after
// rotation, so the compartments slowly drift out of alignment ("each turn ends
// a little shorter than the last"). Using the real count + a fractional
// remainder (see motor.cpp) keeps every slot on its true position forever.
//
// Rotation per slot follows the Instructables "Automatic Pill / Medication
// Dispenser" mechanism: a 7.5:1 reduction gear turns a 15-compartment
// container, so the stepper makes half a revolution to advance one compartment:
//
//     STEPS_PER_SLOT = HALFSTEPS_PER_REV * (gear_ratio / compartments)
//                    = 4075.77 * (7.5 / 15) = 2037.9 half-steps  (~1/2 rev)
//
// To recalibrate for a different build, change ONLY this value:
//   * direct drive (no gear), N slots  -> HALFSTEPS_PER_REV / N
//   * with a g:1 gear,        N slots  -> HALFSTEPS_PER_REV * g / N
#define HALFSTEPS_PER_REV 4075.7728f         // 28BYJ-48 true (63.68395:1 gearbox)
#define STEPS_PER_SLOT    (HALFSTEPS_PER_REV * 0.5f)  // ~2037.9 half-steps/slot
#define STEP_DELAY_MS        2   // 2 ms/half-step -> ~4.1 s per slot (half a rev)

// The dispenser's gears are not properly mounted, so a big fraction of each move
// is lost to slippage/friction and the disc stops well short. Command this
// FRACTION of a slot EXTRA on top of the normal slot rotation so it actually
// lands on target. 0.25 = "normal + a quarter". This physical fudge is added
// AFTER the remainder accumulator, so it never corrupts the geometric count.
// Tune up if it still falls short, down if it overshoots.
#define FRICTION_COMP_FRACTION  0.12f  // normal slot rotation + 12%

// ── EEPROM (simulated in ESP8266 flash) ───────────────────
#define EEPROM_SIZE     60
#define EEPROM_AM_HOUR   0
#define EEPROM_AM_MIN    1
#define EEPROM_PM_HOUR   2
#define EEPROM_PM_MIN    3
#define EEPROM_MED_NAME  4   // 50 bytes, indices 4–53
#define EEPROM_VALID    54   // 0xAB = data initialised
#define EEPROM_MAGIC   0xAB

// ── HTTP server ────────────────────────────────────────────
#define HTTP_PORT 80
