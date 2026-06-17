#include "lcd_display.h"
#include "config.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// The LCD is now optional and self-detecting:
//  - probes the I2C bus for a display at 0x27, then 0x3F
//  - if none answers, lcdPresent stays false and EVERY lcd call is skipped
// This prevents a missing/flaky LCD from hanging setup() (which previously
// blocked the device after WiFi connected, so the HTTP server never started).

static LiquidCrystal_I2C* lcd = nullptr;
static bool lcdPresent = false;

static bool i2cHas(uint8_t addr) {
  Wire.beginTransmission(addr);
  return Wire.endTransmission() == 0;
}

void lcdInit() {
  uint8_t addr = 0;
  if      (i2cHas(0x27)) addr = 0x27;
  else if (i2cHas(0x3F)) addr = 0x3F;
  if (addr == 0) { lcdPresent = false; return; }   // no LCD -> run without it

  lcd = new LiquidCrystal_I2C(addr, LCD_COLS, LCD_ROWS);
  lcdPresent = true;
  lcd->init();
  lcd->backlight();
  lcd->clear();
  lcd->setCursor(2, 0); lcd->print("DisrtuCare");
  lcd->setCursor(3, 1); lcd->print("Starting...");
  delay(1200);
  lcd->clear();
}

void lcdShowSchedule(const char* am, const char* pm) {
  if (!lcdPresent) return;
  lcd->clear();
  lcd->setCursor(0, 0); lcd->print("AM: "); lcd->print(am);
  lcd->setCursor(0, 1); lcd->print("PM: "); lcd->print(pm);
}

void lcdShowStatus(const char* line1, const char* line2) {
  if (!lcdPresent) return;
  lcd->clear();
  lcd->setCursor(0, 0); lcd->print(line1);
  lcd->setCursor(0, 1); lcd->print(line2);
}

void lcdShowDispensing() {
  if (!lcdPresent) return;
  lcd->clear();
  lcd->setCursor(1, 0); lcd->print("Dispensing...");
  lcd->setCursor(2, 1); lcd->print("Please wait");
}

void lcdShowDone() {
  if (!lcdPresent) return;
  lcd->clear();
  lcd->setCursor(2, 0); lcd->print("Dose Ready!");
  lcd->setCursor(0, 1); lcd->print("Press to confirm");
}

void lcdShowNoSync() {
  if (!lcdPresent) return;
  lcd->clear();
  lcd->setCursor(0, 0); lcd->print("Awaiting time");
  lcd->setCursor(0, 1); lcd->print("Open the app...");
}
