/*
 * DisrtuCare — NodeMCU V3 (ESP8266) firmware
 *
 * Hosts a lightweight HTTP server on your home WiFi.
 * The React Native companion app connects to this device's IP
 * address (shown on the LCD at boot) and communicates via HTTP.
 *
 * Required libraries  →  Arduino IDE  →  Library Manager:
 *   - LiquidCrystal_I2C   by Frank de Brabander
 *   - RTClib               by Adafruit
 *   - ArduinoJson          v6  by Benoit Blanchon
 *
 *   The following are already bundled with the ESP8266 board package:
 *   ESP8266WiFi, ESP8266WebServer, Wire, EEPROM
 *
 * Board setup (Tools menu):
 *   Board          → NodeMCU 1.0 (ESP-12E Module)
 *   Upload Speed   → 115200
 *   Flash Size     → 4MB (FS:2MB OTA:~1019KB)
 */

#include <Arduino.h>
#include <EEPROM.h>
#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include "config.h"
#include "motor.h"
#include "lcd_display.h"
#include "rtc_time.h"

// ── HTTP server ────────────────────────────────────────────
static ESP8266WebServer server(HTTP_PORT);

// ── Known WiFi networks ────────────────────────────────────
// The device joins whichever of these is in range (strongest first) and
// automatically switches/reconnects if one drops. Add or edit entries here,
// then flash ONCE — no reflashing to move between these networks afterwards.
static ESP8266WiFiMulti wifiMulti;
static void setupWifiList() {
  wifiMulti.addAP("MG1",                   "doc.client@123");
  wifiMulti.addAP("La_Fibre_dOrange_0E96", "DQKFSQCZ3QCHRAUTT7");
  wifiMulti.addAP("iPhone",                "aya123456789");
  // wifiMulti.addAP("Network_name",       "password");   // <- add more here
}

// ── Schedule ──────────────────────────────────────────────
static uint8_t amHour = 8,  amMin = 0;
static uint8_t pmHour = 20, pmMin = 0;
static char    medName[51] = "Medication";

// ── Dose state ────────────────────────────────────────────
static int  lastDispensedMin = -1;
static bool awaitingConfirm  = false;
static char pendingType[3]   = "";

// ── Event queue (HTTP polling) ─────────────────────────────
static uint8_t eventId       = 0;
static char    lastEventJson[80] = "null";

// ── LED blink ─────────────────────────────────────────────
static bool          ledBlinking   = false;
static bool          ledState      = false;
static unsigned long lastLedToggle = 0;

// ── Button debounce ───────────────────────────────────────
static bool          lastBtnReading = HIGH;
static unsigned long lastDebounceMs = 0;

// ══════════════════════════════════════════════════════════
// EEPROM helpers
// ══════════════════════════════════════════════════════════

static void saveSchedule() {
  EEPROM.write(EEPROM_AM_HOUR, amHour);
  EEPROM.write(EEPROM_AM_MIN,  amMin);
  EEPROM.write(EEPROM_PM_HOUR, pmHour);
  EEPROM.write(EEPROM_PM_MIN,  pmMin);
  for (uint8_t i = 0; i < 50; i++) EEPROM.write(EEPROM_MED_NAME + i, (uint8_t)medName[i]);
  EEPROM.write(EEPROM_VALID, EEPROM_MAGIC);
  EEPROM.commit();
}

static void loadSchedule() {
  if (EEPROM.read(EEPROM_VALID) != EEPROM_MAGIC) return;
  amHour = EEPROM.read(EEPROM_AM_HOUR);
  amMin  = EEPROM.read(EEPROM_AM_MIN);
  pmHour = EEPROM.read(EEPROM_PM_HOUR);
  pmMin  = EEPROM.read(EEPROM_PM_MIN);
  for (uint8_t i = 0; i < 50; i++) medName[i] = (char)EEPROM.read(EEPROM_MED_NAME + i);
  medName[50] = '\0';
}

// ══════════════════════════════════════════════════════════
// Event helpers
// ══════════════════════════════════════════════════════════

static void pushEvent(const char* json) {
  eventId++;
  strncpy(lastEventJson, json, sizeof(lastEventJson) - 1);
  lastEventJson[sizeof(lastEventJson) - 1] = '\0';
}

// ══════════════════════════════════════════════════════════
// Dispense
// ══════════════════════════════════════════════════════════

static void dispense(const char* type) {
  lcdShowDispensing();
  motorRotate(1);
  lcdShowDone();

  ledBlinking     = true;
  awaitingConfirm = true;
  strncpy(pendingType, type, 2);
  pendingType[2] = '\0';

  char evt[64];
  snprintf(evt, sizeof(evt), "{\"evt\":\"dispensed\",\"type\":\"%s\"}", type);
  pushEvent(evt);
}

// ══════════════════════════════════════════════════════════
// HTTP helpers
// ══════════════════════════════════════════════════════════

static void cors() {
  server.sendHeader("Access-Control-Allow-Origin",  "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

static void ok()  { cors(); server.send(200, "application/json", "{\"ok\":true}"); }
static void bad() { cors(); server.send(400, "application/json", "{\"ok\":false,\"error\":\"bad JSON\"}"); }

// ══════════════════════════════════════════════════════════
// HTTP route handlers
// ══════════════════════════════════════════════════════════

static void handleStatus() {
  cors();
  char amStr[6], pmStr[6];
  snprintf(amStr, sizeof(amStr), "%02d:%02d", amHour, amMin);
  snprintf(pmStr, sizeof(pmStr), "%02d:%02d", pmHour, pmMin);

  // Build JSON manually to embed last_event without double-serialisation
  char buf[320];
  snprintf(buf, sizeof(buf),
    "{\"am\":\"%s\",\"pm\":\"%s\",\"med\":\"%s\","
    "\"time\":\"%s\",\"rtc\":%s,\"awaiting\":%s,"
    "\"event_id\":%u,\"last_event\":%s}",
    amStr, pmStr, medName,
    rtcTimeString().c_str(),
    rtcIsRunning() ? "true" : "false",
    awaitingConfirm ? "true" : "false",
    (unsigned)eventId,
    lastEventJson
  );
  server.send(200, "application/json", buf);
}

static void handleSync() {
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain")) != DeserializationError::Ok) { bad(); return; }

  const char* am  = doc["am"];
  const char* pm  = doc["pm"];
  const char* med = doc["med"];

  if (am && strlen(am) == 5) {
    amHour = (uint8_t)((am[0]-'0')*10 + (am[1]-'0'));
    amMin  = (uint8_t)((am[3]-'0')*10 + (am[4]-'0'));
  }
  if (pm && strlen(pm) == 5) {
    pmHour = (uint8_t)((pm[0]-'0')*10 + (pm[1]-'0'));
    pmMin  = (uint8_t)((pm[3]-'0')*10 + (pm[4]-'0'));
  }
  if (med) { strncpy(medName, med, 50); medName[50] = '\0'; }

  saveSchedule();

  char amStr[6], pmStr[6];
  snprintf(amStr, sizeof(amStr), "%02d:%02d", amHour, amMin);
  snprintf(pmStr, sizeof(pmStr), "%02d:%02d", pmHour, pmMin);
  lcdShowSchedule(amStr, pmStr);
  ok();
}

static void handleSetTime() {
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain")) != DeserializationError::Ok) { bad(); return; }

  rtcSetTime(
    doc["year"]  | 2026,
    doc["month"] | 1,
    doc["day"]   | 1,
    doc["h"]     | 0,
    doc["m"]     | 0,
    doc["s"]     | 0
  );
  lastDispensedMin = -1;  // allow today's dose to fire at the correct time

  char amStr[6], pmStr[6];
  snprintf(amStr, sizeof(amStr), "%02d:%02d", amHour, amMin);
  snprintf(pmStr, sizeof(pmStr), "%02d:%02d", pmHour, pmMin);
  lcdShowSchedule(amStr, pmStr);
  ok();
}

static void handleLed() {
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain")) != DeserializationError::Ok) { bad(); return; }
  ledBlinking = false;
  ledState    = doc["state"] | 0;
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  ok();
}

static void handleMotor() {
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain")) != DeserializationError::Ok) { bad(); return; }
  int slots = doc["slots"] | 1;
  lcdShowDispensing();
  motorRotate(slots);
  lcdShowDone();
  pushEvent("{\"evt\":\"dispensed\",\"type\":\"TEST\"}");
  awaitingConfirm = true;
  strncpy(pendingType, "TS", 3);
  ledBlinking = true;
  ok();
}

// Component health check: scans the I2C bus and reports what's detected.
static void handleDiag() {
  cors();
  char i2c[120]; i2c[0] = '\0';
  bool lcdFound = false;
  bool first = true;
  for (uint8_t a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      char tmp[10];
      snprintf(tmp, sizeof(tmp), "%s\"0x%02X\"", first ? "" : ",", a);
      strncat(i2c, tmp, sizeof(i2c) - strlen(i2c) - 1);
      first = false;
      if (a == 0x27 || a == 0x3F) lcdFound = true;
    }
  }
  char buf[256];
  snprintf(buf, sizeof(buf),
    "{\"rtc_hw\":%s,\"rtc_running\":%s,\"lcd\":%s,\"i2c\":[%s],"
    "\"heap\":%u,\"rssi\":%d}",
    rtcHardwarePresent() ? "true" : "false",
    rtcIsRunning()       ? "true" : "false",
    lcdFound             ? "true" : "false",
    i2c,
    (unsigned)ESP.getFreeHeap(),
    (int)WiFi.RSSI());
  server.send(200, "application/json", buf);
}

// On-demand stepper diagnostic (slow coil chase + slow turn).
static void handleSelfTest() {
  cors();
  motorSelfTest();
  server.send(200, "application/json", "{\"ok\":true,\"selftest\":\"done\"}");
}

// ══════════════════════════════════════════════════════════
// Per-loop checks
// ══════════════════════════════════════════════════════════

static void checkSchedule() {
  if (!rtcIsRunning()) return;

  uint16_t nowMins = (uint16_t)(rtcHour() * 60 + rtcMinute());
  uint16_t amMins  = (uint16_t)(amHour  * 60 + amMin);
  uint16_t pmMins  = (uint16_t)(pmHour  * 60 + pmMin);

  if (nowMins == amMins && lastDispensedMin != (int)amMins) {
    lastDispensedMin = (int)amMins;
    dispense("AM");
  } else if (nowMins == pmMins && lastDispensedMin != (int)pmMins) {
    lastDispensedMin = (int)pmMins;
    dispense("PM");
  }

  // Reset daily at midnight so tomorrow's doses fire again
  if (nowMins == 0 && lastDispensedMin > 0) lastDispensedMin = -1;
}

static void checkButton() {
  bool reading = digitalRead(BUTTON_PIN);
  unsigned long now = millis();

  if (reading != lastBtnReading) lastDebounceMs = now;
  lastBtnReading = reading;
  if (now - lastDebounceMs < 50) return;

  if (reading == LOW && awaitingConfirm) {
    awaitingConfirm = false;
    ledBlinking     = false;
    digitalWrite(LED_PIN, HIGH);
    delay(1500);
    digitalWrite(LED_PIN, LOW);

    char amStr[6], pmStr[6];
    snprintf(amStr, sizeof(amStr), "%02d:%02d", amHour, amMin);
    snprintf(pmStr, sizeof(pmStr), "%02d:%02d", pmHour, pmMin);
    lcdShowSchedule(amStr, pmStr);

    char evt[48];
    snprintf(evt, sizeof(evt), "{\"evt\":\"confirmed\",\"type\":\"%s\"}", pendingType);
    pushEvent(evt);
  }
}

static void updateLed() {
  if (!ledBlinking) return;
  unsigned long now = millis();
  if (now - lastLedToggle >= 600) {
    ledState      = !ledState;
    lastLedToggle = now;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  }
}

// ══════════════════════════════════════════════════════════
// Setup & Loop
// ══════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  Wire.begin(I2C_SDA, I2C_SCL);

  pinMode(LED_PIN,    OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);

  motorInit();
  lcdInit();
  rtcInit();
  loadSchedule();

  // NOTE: the motor self-test is NOT run at boot — spinning the stepper at
  // startup can brown out the ESP8266 (motor inrush current) and stop it
  // reaching WiFi. It is exposed on demand via the /selftest endpoint instead.

  // ── Connect to WiFi ──────────────────────────────────────
  // ── Connect to WiFi (multi-network) ──────────────────────
  // Tries every network in setupWifiList() and joins whichever is available.
  WiFi.mode(WIFI_STA);
  setupWifiList();
  lcdShowStatus("Searching for", "known WiFi...");

  uint8_t tries = 0;
  while (wifiMulti.run(5000) != WL_CONNECTED && tries < 8) {
    tries++;   // wifiMulti.run() scans + connects, 5 s timeout per attempt
  }

  if (WiFi.status() == WL_CONNECTED) {
    String ip = WiFi.localIP().toString();
    Serial.println("Connected to " + WiFi.SSID() + "  IP: " + ip);
    // Show the joined network + IP on the LCD
    lcdShowStatus(WiFi.SSID().c_str(), ip.c_str());
    delay(5000);  // leave it visible for 5 s
  } else {
    lcdShowStatus("No known WiFi", "Runs offline");
    Serial.println("No known WiFi found — running offline; will keep retrying.");
    // Continue without WiFi; dispenser still runs autonomously
  }

  char amStr[6], pmStr[6];
  snprintf(amStr, sizeof(amStr), "%02d:%02d", amHour, amMin);
  snprintf(pmStr, sizeof(pmStr), "%02d:%02d", pmHour, pmMin);
  lcdShowSchedule(amStr, pmStr);

  // ── Register HTTP routes ──────────────────────────────────
  server.on("/status",   HTTP_GET,     handleStatus);
  server.on("/sync",     HTTP_POST,    handleSync);
  server.on("/settime",  HTTP_POST,    handleSetTime);
  server.on("/led",      HTTP_POST,    handleLed);
  server.on("/motor",    HTTP_POST,    handleMotor);
  server.on("/diag",     HTTP_GET,     handleDiag);
  server.on("/selftest", HTTP_GET,     handleSelfTest);

  // CORS preflight for all POST routes
  auto preflight = []() { cors(); server.send(204); };
  server.on("/sync",    HTTP_OPTIONS, preflight);
  server.on("/settime", HTTP_OPTIONS, preflight);
  server.on("/led",     HTTP_OPTIONS, preflight);
  server.on("/motor",   HTTP_OPTIONS, preflight);

  server.onNotFound([]() { cors(); server.send(404, "application/json", "{\"error\":\"not found\"}"); });
  server.begin();
  Serial.println("HTTP server ready on port " + String(HTTP_PORT));
}

// Keep WiFi alive: if we drop, re-scan the known-network list and join the best
// one that's currently available (this also auto-switches networks if you move).
static unsigned long lastWifiAttempt = 0;
static bool wasConnected = false;

static void maintainWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wasConnected) {
      wasConnected = true;
      String ip = WiFi.localIP().toString();
      Serial.println("WiFi connected to " + WiFi.SSID() + "  IP: " + ip);
      lcdShowStatus(WiFi.SSID().c_str(), ip.c_str());
    }
    return;
  }
  wasConnected = false;
  unsigned long now = millis();
  if (now - lastWifiAttempt < 8000) return;   // retry every ~8 s
  lastWifiAttempt = now;
  wifiMulti.run(5000);   // re-scan and join the best available known network
}

void loop() {
  server.handleClient();
  maintainWifi();
  checkSchedule();
  checkButton();
  updateLed();
}
