#pragma once

// ── WiFi ──────────────────────────────────────────────────
// The list of known networks lives in distruccare.ino -> setupWifiList().
// The device joins whichever one is available. Add/edit networks there.

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
// 28BYJ-48: 2048 full steps/rev  ->  4096 HALF-steps per stepper revolution.
//
// Rotation per slot follows the Instructables "Automatic Pill / Medication
// Dispenser" mechanism: a 7.5:1 reduction gear turns a 15-compartment
// container, so the stepper makes EXACTLY half a revolution (180 deg) to
// advance the container by one compartment:
//
//     STEPS_PER_SLOT = 4096 * (gear_ratio / compartments)
//                    = 4096 * (7.5 / 15) = 2048 half-steps  (= 1/2 revolution)
//
// To recalibrate for a different build, change ONLY this value:
//   * direct drive (no gear), N slots  -> 4096 / N      (4 slots=1024, 8=512)
//   * with a g:1 gear,        N slots  -> 4096 * g / N
#define HALFSTEPS_PER_REV 4096
#define STEPS_PER_SLOT    2048   // half-steps to advance EXACTLY one compartment
#define STEP_DELAY_MS        2   // 2 ms/half-step -> ~4.1 s per slot (half a rev)

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
