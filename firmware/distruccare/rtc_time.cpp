#include "rtc_time.h"
#include <Wire.h>
#include <RTClib.h>

// Time source:
//  - If a DS3231 is present on the I2C bus, use it (keeps time across reboots).
//  - Otherwise fall back to a SOFTWARE clock: seeded by the app via /settime
//    and advanced with millis(). Drifts slightly and resets on reboot, so the
//    app re-syncs on every connect. This lets scheduling work with no RTC wired.

static RTC_DS3231 rtc;
static bool hwPresent = false;   // DS3231 detected

// Software-clock state (used only when hwPresent == false)
static bool     swValid     = false;       // true once the app has synced time
static uint32_t swBaseSec   = 0;           // seconds-since-midnight at sync moment
static uint32_t swBaseMillis = 0;          // millis() at sync moment

static uint32_t swSecondsOfDay() {
  uint32_t elapsedSec = (millis() - swBaseMillis) / 1000UL;
  return (swBaseSec + elapsedSec) % 86400UL;
}

void rtcInit() {
  if (rtc.begin()) {
    hwPresent = true;
    if (rtc.lostPower()) {
      // Fallback to compile-time until the app syncs the real time
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
  } else {
    hwPresent = false;   // will use software clock once /settime arrives
  }
}

// "Running" means we know the time well enough to schedule.
//  - Hardware: always once detected.
//  - Software: only after the app has synced (avoids a bogus 00:00 dispense).
bool rtcIsRunning() {
  return hwPresent || swValid;
}

bool rtcHardwarePresent() {
  return hwPresent;
}

void rtcSetTime(uint16_t year, uint8_t month, uint8_t day,
                uint8_t h, uint8_t m, uint8_t s) {
  if (hwPresent) {
    rtc.adjust(DateTime(year, month, day, h, m, s));
  } else {
    swBaseSec    = (uint32_t)h * 3600UL + (uint32_t)m * 60UL + s;
    swBaseMillis = millis();
    swValid      = true;
  }
}

uint8_t rtcHour() {
  if (hwPresent) return rtc.now().hour();
  if (swValid)   return (uint8_t)((swSecondsOfDay() / 3600UL) % 24UL);
  return 0;
}

uint8_t rtcMinute() {
  if (hwPresent) return rtc.now().minute();
  if (swValid)   return (uint8_t)((swSecondsOfDay() / 60UL) % 60UL);
  return 0;
}

String rtcTimeString() {
  if (!rtcIsRunning()) return "--:--";
  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", rtcHour(), rtcMinute());
  return String(buf);
}
